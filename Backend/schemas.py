from pydantic import BaseModel, ConfigDict, model_validator
from datetime import datetime
from typing import Optional

class User(BaseModel):
    uid: str
    name: Optional[str] = None
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class CreatePost(BaseModel):
    content: str

class ResponseAuthor(BaseModel):
    id: int
    username:str

    class Config:
        from_attributes = True

class ResponseCreate(BaseModel):
    content: str

class ResponseOut(BaseModel):
    id: int
    content: str
    post_id: int
    parent_response_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    author: ResponseAuthor

    class Config:
        from_attributes = True

class AppriciateCreate(BaseModel):
    post_id: Optional[int] = None
    response_id: Optional[int] = None

    @model_validator(mode="after")
    def validate_target(self):
        if bool(self.post_id) == bool(self.response_id):
            raise ValueError("Exactly one of post_id or response_id must be provided.")
        return self
    
class AppriciateOut(BaseModel):
    post_id: Optional[int] = None
    response_id: Optional[int] = None
    user_id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class AppreciateStatus(BaseModel):
    appreciated: bool
    count: int

class FollowStatus(BaseModel):
    following: bool

class Posts(BaseModel):
    id: int
    user_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityOut(BaseModel):
    posts: list[Posts]

class PostOut(BaseModel):
    id: int
    user_id: int
    content: str
    created_at: datetime
    author: User

    model_config = ConfigDict(from_attributes=True)