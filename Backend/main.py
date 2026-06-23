import os
import json
from fastapi import FastAPI, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session, joinedload
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

service_account_info = json.loads(os.getenv("FIREBASE_SERVICE_ACCOUNT"))
cred = credentials.Certificate(service_account_info)
firebase_admin.initialize_app(cred)

origins = [
    "https://spiritingaway.vercel.app",
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

@app.get("/user")
def get_user(user_id, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found for the provided ID by the post."
        )
    return user

@app.get("/posts")
def get_posts(
    sort: str = "new",
    skip:int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)):
    posts = db.query(models.Post).order_by(models.Post.created_at.desc()).offset(skip).limit(limit).all()
    # Sorting Algorithm based on the 'sort' parameter
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

@app.get("/posts/{post_id}/responses", response_model=list[schemas.ResponseOut])
def get_responses(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=404,
            detail="Post not found."
        )
    
    responses = (
        db.query(models.Response).options(joinedload(models.Response.author)).filter(models.Response.post_id == post_id).all()
    )
    return responses

@app.post("/responses/{response_id}/responses", response_model=schemas.ResponseOut, status_code=201)
def create_response_to_response(response_id: int, response: schemas.ResponseCreate, db: Session = Depends(get_db),
                                decoded_token: dict = Depends(verify_firebase_token)):
    uid = decoded_token["uid"]
    user = db.query(models.User).filter(models.User.uid == uid).first()
    parent_response = db.query(models.Response).filter(models.Response.id == response_id).first()

    if not parent_response:
        raise HTTPException(
            status_code=404,
            detail="Parent response not found."
        )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found. Please login first."
        )

    new_response = models.Response(
        post_id=parent_response.post_id,
        user_id=user.id,
        content=response.content
    )
    db.add(new_response)
    db.commit()
    db.refresh(new_response)

    new_response = (
        db.query(models.Response)
        .options(joinedload(models.Response.author))
        .filter(models.Response.id == new_response.id)
        .first()
    )
    return new_response

@app.post("/posts/{post_id}/responses", response_model=schemas.ResponseOut, status_code=201)
def create_response(post_id: int, response: schemas.ResponseCreate, db: Session = Depends(get_db),
                    decoded_token: dict = Depends(verify_firebase_token)):
    uid = decoded_token["uid"]
    user = db.query(models.User).filter(models.User.uid == uid).first()
    post = db.query(models.Post).filter(models.Post.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=404,
            detail="Post not found."
        )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found. Please login first."
        )
    
    new_response = models.Response(
        post_id=post_id,
        user_id=user.id,
        content=response.content
    )
    db.add(new_response)
    db.commit()
    db.refresh(new_response)

    new_response = (
    db.query(models.Response)
    .options(joinedload(models.Response.author))
    .filter(models.Response.id == new_response.id)
    .first()
    )
    return new_response

def toggle_appreciate(db, user_id, *, post_id=None, response_id=None):
    existing = db.query(models.Appreciates).filter(
        models.Appreciates.post_id == post_id,
        models.Appreciates.user_id == user_id,
        models.Appreciates.response_id == response_id).first()

    if existing:
        appreciated = False
        db.query(models.Appreciates).filter(
        models.Appreciates.post_id == post_id,
        models.Appreciates.user_id == user_id,
        models.Appreciates.response_id == response_id).delete(synchronize_session=False)
        db.commit()
    else:
        appreciated = True
        new_appreciate = models.Appreciates(
        post_id=post_id,
        response_id=response_id,
        user_id=user_id
        )
        db.add(new_appreciate)
        db.commit()

    count_filter = (
    models.Appreciates.post_id == post_id
    if post_id is not None
    else models.Appreciates.response_id == response_id
    )
    count = db.query(models.Appreciates).filter(count_filter).count()
    return {"appreciated": appreciated, "count": count}


@app.get("/posts/{id}/appreciate", response_model=schemas.AppreciateStatus)
def get_post_appreciate_status(id: int, db: Session = Depends(get_db), decoded_token: dict = Depends(verify_firebase_token)):
    count = db.query(models.Appreciates).filter(models.Appreciates.post_id == id).count()
    user_id = db.query(models.User.id).filter(models.User.uid == decoded_token["uid"]).scalar()
    
    appreciated = db.query(models.Appreciates).filter(
        models.Appreciates.post_id == id,
        models.Appreciates.user_id == user_id
    ).first() is not None
    return {"appreciated": appreciated, "count": count}

@app.get("/responses/{id}/appreciate", response_model=schemas.AppreciateStatus)
def get_response_appreciate_status(id: int, db: Session = Depends(get_db), decoded_token: dict = Depends(verify_firebase_token)):
    
    count = db.query(models.Appreciates).filter(models.Appreciates.response_id == id).count()
    user_id = db.query(models.User.id).filter(models.User.uid == decoded_token["uid"]).scalar()
    
    appreciated = db.query(models.Appreciates).filter(
        models.Appreciates.response_id == id,
        models.Appreciates.user_id == user_id
    ).first() is not None
    return {"appreciated": appreciated, "count": count}


@app.post("/posts/{id}/appreciate", response_model=schemas.AppreciateStatus, status_code=201)
def appreciate_post(id: int, db: Session = Depends(get_db),
                    decoded_token: dict = Depends(verify_firebase_token)):
    uid = decoded_token["uid"]
    user = db.query(models.User).filter(models.User.uid == uid).first()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found. Please login first."
        )
    
    return toggle_appreciate(db, user.id, post_id=id)

@app.post("/responses/{id}/appreciate", response_model=schemas.AppreciateStatus, status_code=201)
def appreciate_response(id: int, db: Session = Depends(get_db),
                       decoded_token: dict = Depends(verify_firebase_token)):
    uid = decoded_token["uid"]
    user = db.query(models.User).filter(models.User.uid == uid).first()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found. Please login first."
        )
    
    return toggle_appreciate(db, user.id, response_id=id)