from langchain_groq import ChatGroq
import os
from typing import List, Dict

email_type_llm = ChatGroq(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0,
)


def get_email_type(emails: List[Dict]):
    updated_mails = []
    system_prompt = """
You are an advanced email classifier.

Classify each email into ONE of these category:
- important
- spam
- promotion
- social
- updates
- normal

==================================================
DETAILED CLASSIFICATION RULES
==================================================

IMPORTANT:
- Job offers
- Interview invitations
- Hiring emails
- Bank transaction alerts
- Payment confirmations
- OTP / authentication emails
- Legal notices
- Personal direct emails
- Client communication
- Order confirmations

PROMOTION:
- Marketing emails
- Discount offers
- Sales campaigns
- Product promotions
- Affiliate marketing
- Newsletter marketing
- Limited time deals

SOCIAL:
- LinkedIn notifications
- Facebook / Instagram notifications
- Twitter / X notifications
- Social media messages
- Connection requests
- Mentions
- Social platform alerts

UPDATES:
- System notifications
- Service updates
- Subscription updates
- App update emails
- Bug reports
- Account setting changes
- Receipt confirmations
- Delivery tracking

SPAM:
- Suspicious links
- Fake lottery emails
- Crypto scams
- Unknown senders asking for money
- Phishing attempts
- Suspicious attachments
- Email spoofing attempts

NORMAL:
- Emails that do not fit above categories

==================================================

Return ONLY category

"""
    for mail in emails:
        messages = [
            (
                "system",
                system_prompt,
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
