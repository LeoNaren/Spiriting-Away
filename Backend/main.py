from fastapi import FastAPI, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import firebase_admin
from firebase_admin import auth, credentials
from fastapi.middleware.cors import CORSMiddleware
import string
import secrets

import models
import schemas
from database import get_db

app = FastAPI(title="Spiriting Away Backend")

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

def verify_firebase_token(authorization: str = Header(...)):
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Invalid authorization header"
            )
        token = authorization.split(" ")[1]
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid Firebase token."
        )


origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/posts")
def get_all_posts(db: Session = Depends(get_db)):
    posts = db.query(models.Post).all()
    return posts

@app.post("/posts")
def create_post(post: schemas.CreatePost, db: Session = Depends(get_db),
                decoded_token: dict = Depends(verify_firebase_token)):
    uid = decoded_token["uid"]
    user = db.query(models.User).filter(models.User.uid == uid).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )
    new_post = models.Post(
        user_id= db.query(models.User.id).filter(models.User.uid == uid).scalar(),
        content=post.content
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

def generate_suffix(length: int = 6) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

@app.post("/user/auth", response_model=schemas.UserResponse)
def authentical_or_register_user(
    decoded_token: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db)
    ):
    uid = decoded_token["uid"]
    email = decoded_token.get("email")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email not found in Firebase token.")
    incoming_name = decoded_token.get("name")

    user = db.query(models.User).filter(models.User.uid == uid).first()
    if user:
        print(f"Welcome back, {user.username}!")
        return user
    
    base_username = f"{incoming_name.replace(' ', '').lower() if incoming_name else 'user'}"
    final_username = f"{base_username}{generate_suffix()}"

    user = models.User(
        uid=uid,
        name=incoming_name,
        username=final_username,
        email=email
    )

    db.add(user)
    
    try:
        db.commit()
        db.refresh(user)
        print(f"New user registered: {user.username}")
    except IntegrityError:
        db.rollback()
        
        fallback_username = f"{base_username}{generate_suffix()}"
        
        user = models.User(
        uid=uid,
        name=incoming_name,
        username=fallback_username,
        email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"New user registered with fallback username: {user.username}")
    
    return user