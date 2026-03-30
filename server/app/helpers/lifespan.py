from tortoise import Tortoise
import os

async def lifespan(_):
    await Tortoise.init(
        db_url=os.environ.get("DATABASE_URL"),
        modules={
            "models": [
                "app.models.email",
                "app.models.sent_email",
            ]
        },
    )
    await Tortoise.generate_schemas()
    yield
    await Tortoise.close_connections()
