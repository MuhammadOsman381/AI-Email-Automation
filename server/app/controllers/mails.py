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

router = APIRouter(prefix="/api/mails", tags=["Mails"])

@router.get("/push")
async def get_mails():
    ids = get_today_mail_ids()
    if ids:
        existing_ids = await Email.filter(mail_id__in=ids).values_list(
            "mail_id", flat=True
        )
        new_ids = [eid for eid in ids if eid not in existing_ids]
        if new_ids:
            new_mails = fetch_mails_by_ids(new_ids)
            updated_mails = get_email_type(new_mails)
            for mail in updated_mails:
                await Email.create(
                    mail_id=mail["id"],
                    subject=mail["subject"],
                    sender=mail["from"],
                    date=mail["date"],
                    category=mail["category"],
                    body=mail["body_html"],
                )
    return {
        "message": "Mails fetched sucesfully!",
    }


@router.get("/get")
async def get_all_mails():
    emails = await Email.all().order_by("-created_at").values()
    return {"message": "success!", "mails": emails}


@router.post("/compose")
async def compose_mail(
    to: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    try:
        email_id = str(uuid.uuid4())

        tracking_pixel = f'''
        <img src="http://localhost:8000/api/mails/track/{email_id}"
        width="1"
        height="1"
        style="display:none;" />
        '''
        body = body + tracking_pixel
        await send_mail(to, subject, body, file)
        return {"message": "Mail sent successfully!", "email_id": email_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

pixel = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
)
@router.get("/track/{email_id}")
async def track(email_id: str):
    print("Email opened:", email_id)
    await send_mail("mosman257@gmail.com", "Email Tracking", "Your email is opened", None)
    return Response(content=pixel, media_type="image/png")