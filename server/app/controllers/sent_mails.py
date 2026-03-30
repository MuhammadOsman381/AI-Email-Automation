from fastapi import APIRouter, HTTPException
from app.models.sent_email import SentEmail

router = APIRouter(prefix="/api/sent-mails", tags=["Sent Mails"])

@router.get("/")
async def get_sent_mails():
    try:
        sent_mails = await SentEmail.all()
        return {"message": "success!", "data": sent_mails}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))