from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.mails import router as mails_router
from app.controllers.sent_mails import router as sent_mails_router
from apscheduler.schedulers.background import BackgroundScheduler
import time
from app.helpers.lifespan import lifespan
from app.controllers.mails import get_mails
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mails_router)
app.include_router(sent_mails_router)

@app.get("/")
def read_root():
    return {"Hello World"}


scheduler = AsyncIOScheduler()
scheduler.add_job(get_mails, "interval", seconds=1800)
scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()
