from tortoise import fields
from tortoise.models import Model

class SentEmail(Model):
    id = fields.IntField(pk=True)    
    sender = fields.CharField(max_length=255)
    to = fields.CharField(max_length=255)
    subject = fields.TextField()
    body = fields.TextField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True);