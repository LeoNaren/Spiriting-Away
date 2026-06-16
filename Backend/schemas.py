from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserResponse(BaseModel):
    uid: str
    name: Optional[str] = None
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class CreatePost(BaseModel):
    content: str