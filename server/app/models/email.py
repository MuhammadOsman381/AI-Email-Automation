from tortoise import fields
from tortoise.models import Model

class Email(Model):
    id = fields.IntField(pk=True)
    mail_id = fields.CharField(max_length=255, unique=True)
    subject = fields.TextField()
    sender = fields.CharField(max_length=255)
    body = fields.TextField(null=True)
    date = fields.CharField(max_length=255)
    category = fields.CharField(max_length=255)
    created_at = fields.DatetimeField(auto_now_add=True)