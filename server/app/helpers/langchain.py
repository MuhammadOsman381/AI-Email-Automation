from langchain_groq import ChatGroq
import os
from typing import List, Dict
from langchain_community.document_loaders import PyPDFLoader
from fastapi import UploadFile
import json
import logging
import re
from langchain_core.pydantic_v1 import BaseModel, Field
from app.helpers.prompts import (
    generate_email_system_prompt,
    get_email_type_system_prompt,
    generate_reply_system_prompt
)

logger = logging.getLogger(__name__)

email_type_llm = ChatGroq(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0,
)


class EmailOutput(BaseModel):
    subject: str = Field(description="Email subject line")
    body: str = Field(
        description="Email body in HTML format using only <p>, <strong>, <em>, <ul>, <li>, <br> tags"
    )


def get_email_type(emails: List[Dict]):
    updated_mails = []
    for mail in emails:
        messages = [
            (
                "system",
                get_email_type_system_prompt,
            ),
            ("human", f"subject:{mail['subject']}, body:{mail['body']}"),
        ]
        ai_msg = email_type_llm.invoke(messages)
        updated_mails.append(
            {
                "id": mail["id"],
                "from": mail["from"],
                "subject": mail["subject"],
                "date": mail["date"],
                "body": mail["body"],
                "body_html": mail["body_html"],
                "category": ai_msg.content,
            }
        )
    return updated_mails


def clean_json_response(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw.strip())
        raw = raw.strip()
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        raw = raw[start : end + 1]
    result = []
    in_string = False
    escape_next = False

    for char in raw:
        if escape_next:
            result.append(char)
            escape_next = False
            continue

        if char == "\\" and in_string:
            result.append(char)
            escape_next = True
            continue
        if char == '"':
            in_string = not in_string
            result.append(char)
            continue
        if in_string:
            if char == "\n":
                result.append("\\n")
            elif char == "\r":
                result.append("\\r")
            elif char == "\t":
                result.append("\\t")
            else:
                result.append(char)
        else:
            result.append(char)

    return "".join(result)


def generate_professional_mail(prompt: str, pdf_text: str):
    system_prompt = generate_email_system_prompt;
    user_message = f"""User Request:
{prompt}
PDF Extracted Text (Optional):
{pdf_text if pdf_text and pdf_text.strip() else "No PDF provided."}"""

    structured_llm = email_type_llm.with_structured_output(EmailOutput)

    try:
        result: EmailOutput = structured_llm.invoke(
            [
                ("system", system_prompt),
                ("human", user_message),
            ]
        )
        return {"subject": result.subject, "body": result.body}

    except Exception as e:
        logger.error(f"generate_professional_mail failed: {e}")
        raise


async def get_text_from_pdf(file: UploadFile):
    if file:
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        loader = PyPDFLoader(temp_path)
        documents = loader.load()
        text = "\n".join([doc.page_content for doc in documents])
        os.remove(temp_path)
        return text
    else:
        return ""


async def generate_reply(from_mail: str, subject: str, body: str):
    user_message = f"""From: {from_mail}
Subject: {subject}
Email content:
{body}
Write a professional reply."""
    messages = [
        ("system", generate_reply_system_prompt),
        ("human", user_message),
    ]
    try:
        llm_response = email_type_llm.invoke(messages)
        raw = llm_response.content.strip()
        parsed = json.loads(raw)
        return {
            "subject": parsed["subject"],
            "body": parsed["body"],
        }
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            return {
                "subject": parsed["subject"],
                "body": parsed["body"],
            }
        raise ValueError(f"LLM returned invalid JSON: {raw}")
    except Exception as e:
        logger.error(f"generate_reply failed: {e}")
        raise ValueError(f"Failed to generate reply: {e}")
