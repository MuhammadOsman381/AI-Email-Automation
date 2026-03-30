from fastapi import APIRouter, HTTPException
import os
import imaplib
import email
from email.header import decode_header
from datetime import datetime
from app.helpers.mails import get_today_mail_ids, fetch_mails_by_ids
from app.models.email import Email
from app.helpers.langchain import get_email_type
from fastapi import UploadFile, File, Form
from typing import Optional
import uuid
import base64
from app.helpers.mails import send_mail
from fastapi.responses import Response
from pydantic import BaseModel
from app.helpers.langchain import generate_professional_mail
from app.helpers.langchain import get_text_from_pdf
from app.models.sent_email import SentEmail
from app.helpers.beautiful_soup import extract_useful_text
from app.helpers.langchain import generate_reply
from itertools import islice


router = APIRouter(prefix="/api/mails", tags=["Mails"])


class GenrateReply(BaseModel):
    from_mail: str
    subject: str
    body: str


def chunked(iterable, size):
    it = iter(iterable)
    while chunk := list(islice(it, size)):
        yield chunk


def trim_text(text, max_chars=800):
    return text[:max_chars] if text else ""


@router.get("/push")
async def get_mails():
    print("Fetching mails...")
    ids = get_today_mail_ids()
    if not ids:
        return {"message": "No mails found"}
    existing_ids = set(
        await Email.filter(mail_id__in=ids).values_list("mail_id", flat=True)
    )
    new_ids = [eid for eid in ids if eid not in existing_ids]
    if not new_ids:
        return {"message": "No new mails to insert"}
    for chunk_ids in chunked(new_ids, 2):
        mails = fetch_mails_by_ids(chunk_ids)
        processed_mails = []
        for mail in mails:
            clean_body = await extract_useful_text(mail.get("body_html", ""))
            clean_body = trim_text(clean_body, 800)
            classified = get_email_type(
                [
                    {
                        "id": mail["id"],
                        "subject": mail["subject"],
                        "from": mail["from"],
                        "date": mail["date"],
                        "body": clean_body,
                        "body_html": mail["body_html"],
                    }
                ]
            )[0]
            processed_mails.append(
                {
                    "id": mail["id"],
                    "subject": mail["subject"],
                    "from": mail["from"],
                    "date": mail["date"],
                    "category": classified["category"],
                    "body": mail["body_html"],
                }
            )
        email_objects = [
            Email(
                mail_id=mail["id"],
                subject=mail["subject"],
                sender=mail["from"],
                date=mail["date"],
                category=mail["category"],
                body=mail["body"],
            )
            for mail in processed_mails
        ]
        await Email.bulk_create(email_objects)
    return {"message": "Mails fetched and stored successfully!"}


@router.get("/get")
async def get_all_mails():
    emails = await Email.all().order_by("-created_at").values()
    return {"message": "success!", "mails": emails}


@router.post("/compose")
async def compose_mail(
    to: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    file: Optional[UploadFile] = File(None),
):
    try:
        await send_mail(to, subject, body, file)
        await SentEmail.create(
            sender=os.getenv("EMAIL"),
            to=to,
            subject=subject,
            body=body,
        )
        return {"message": "Mail sent successfully!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
async def generate_mail(
    prompt: str = Form(...),
    file: Optional[UploadFile] = File(None),
):
    try:
        pdf_text = await get_text_from_pdf(file)
        generated_mail = generate_professional_mail(prompt, pdf_text)
        return {"message": "success!", "data": generated_mail}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-reply")
async def generate_mail(data: GenrateReply):
    try:
        clean_body = await extract_useful_text(data.body)
        reply = await generate_reply(data.from_mail, data.subject, clean_body)
        return {
            "message": "success!",
            "reply": reply,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{id}")
async def generate_mail(id: str):
    try:
        await Email.filter(id=id).delete()
        return {"message": "success!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete-all")
async def delete_all_mails():
    try:
        await Email.all().delete()
        return {"message": "all emails deleted successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))