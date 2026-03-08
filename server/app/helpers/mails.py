from fastapi import APIRouter, HTTPException
import os
import imaplib
import email
from email.header import decode_header
from datetime import datetime
import re
import smtplib
from email.message import EmailMessage
from typing import Optional
from fastapi import UploadFile

def clean_text(text):
    if not text:
        return ""
    text = str(text)
    text = re.sub(
        r"["
        u"\U0001F600-\U0001F64F"
        u"\U0001F300-\U0001F5FF"
        u"\U0001F680-\U0001F6FF"
        u"\U0001F700-\U0001F77F"
        u"\U0001F780-\U0001F7FF"
        u"\U0001F800-\U0001F8FF"
        u"\U0001F900-\U0001F9FF"
        u"\U0001FA00-\U0001FAFF"
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        "]+",
        "",
        text,
    )
    text = re.sub(r"[^\w\s@.,:-]", "", text)
    return text.strip()

def get_today_mail_ids():
    try:
        email_user = os.getenv("EMAIL")
        email_pass = os.getenv("PASSWORD")
        if not email_user or not email_pass:
            raise HTTPException(status_code=500, detail="Email credentials not set")
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(email_user, email_pass)
        mail.select("inbox")
        today = datetime.now().strftime("%d-%b-%Y")
        status, messages = mail.search(None, f"SINCE {today}")
        if status != "OK":
            raise HTTPException(status_code=400, detail="Failed to fetch email ids")
        email_ids = messages[0].split()
        mail.logout()
        return [eid.decode() for eid in email_ids]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def fetch_mails_by_ids(email_ids: list):
    try:
        email_user = os.getenv("EMAIL")
        email_pass = os.getenv("PASSWORD")
        if not email_user or not email_pass:
            raise HTTPException(status_code=500, detail="Email credentials not set")
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(email_user, email_pass)
        mail.select("inbox")
        emails = []
        for eid in reversed(email_ids):
            status, msg_data = mail.fetch(eid.encode(), "(RFC822)")
            if status != "OK":
                continue
            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)
            subject, encoding = decode_header(msg["Subject"] or "")[0]
            if isinstance(subject, bytes):
                subject = subject.decode(
                    encoding if encoding else "utf-8", errors="ignore"
                )
            from_ = msg.get("From")
            date_ = msg.get("Date")
           
            body_plain = ""
            body_html = ""

            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get("Content-Disposition"))
                    if content_type == "text/plain" and "attachment" not in content_disposition:
                        body_plain = part.get_payload(decode=True).decode(errors="ignore")
                    if content_type == "text/html" and "attachment" not in content_disposition:
                        body_html = part.get_payload(decode=True).decode(errors="ignore")
            else:
                body_plain = msg.get_payload(decode=True).decode(errors="ignore")
                
                
            email_match = re.search(r"<(.+?)>", from_)
            email_address = email_match.group(1) if email_match else from_
            clean_subject = clean_text(subject)
            clean_body = clean_text(body_plain or body_html)
            emails.append(
                {
                    "id": eid,
                    "subject": subject,
                    "from": email_address,
                    "date": date_,
                    "body": body_plain,
                    "body_html": body_html
                }
            )
        mail.logout()
        return emails
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_USER = os.getenv("EMAIL")
EMAIL_PASSWORD = os.getenv("PASSWORD")

async def send_mail(
    to: str,
    subject: str,
    body: str,
    file: Optional[UploadFile] = None
):
    msg = EmailMessage()
    msg["From"] = EMAIL_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.add_alternative(body, subtype="html")
    if file:
        content = await file.read()

        msg.add_attachment(
            content,
            maintype="application",
            subtype="octet-stream",
            filename=file.filename
        )
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.send_message(msg)