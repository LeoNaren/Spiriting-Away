import os
import json
from fastapi import FastAPI, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, select
import firebase_admin
from firebase_admin import auth, credentials
from fastapi.middleware.cors import CORSMiddleware
import string
import secrets
import models
import schemas
from database import get_db, engine
import models
from datetime import timedelta, timezone, datetime
from typing import Optional

models.Base.metadata.create_all(bind=engine)

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

@app.get("/post/{id}", response_model=list[schemas.PostOut])
def get_post(id: int, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == id).first()
    if not post:
        raise HTTPException(
            status_code=404,
            detail="Post not found."
        )
    return post

@app.get("/feed-posts", response_model=list[schemas.PostOut])
def get_posts(
    sort: str = "trending",
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)):
    
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    if(sort == "new"):
        posts = (
            db.query(models.Post)
            .options(joinedload(models.Post.author))
            .order_by(models.Post.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    else:
        trend_score = (
        func.count(models.Appreciates.user_id.distinct()) +
        func.count(models.PostFollow.user_id.distinct()) +
        func.count(models.Response.id.distinct())
        ).label("trend_score")
        print(f"Trend score query: {trend_score}")

        trending_subq = (
            db.query(
                models.Post.id.label("post_id"),
                trend_score
            )
            .outerjoin(models.Appreciates, (models.Appreciates.post_id == models.Post.id) & (models.Appreciates.created_at >= week_ago))
            .outerjoin(models.PostFollow, (models.PostFollow.post_id == models.Post.id) & (models.PostFollow.created_at >= week_ago))
            .outerjoin(models.Response, (models.Response.post_id == models.Post.id) & (models.Response.created_at >= week_ago))
            .group_by(models.Post.id)
            .subquery()
        )
        print(f"Trending subquery: {trending_subq}")

        posts = (
            db.query(models.Post)
            .options(joinedload(models.Post.author))
            .join(trending_subq, trending_subq.c.post_id == models.Post.id)
            .order_by(trending_subq.c.trend_score.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    return posts

def generate_suffix(length: int = 6) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

@app.post("/user/auth", response_model=schemas.User)
def authenticate_or_register_user(
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

@app.get("/posts/{post_id}/{limit}/responses", response_model=list[schemas.ResponseOut])
def get_responses(post_id: int, limit: Optional[int] = None, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=404,
            detail="Post not found."
        )
    
    appreciate_count = func.count(models.Appreciates.user_id.distinct()).label("appreciate_count")

    counts_subq = (
        db.query(
            models.Response.id.label("response_id"),
            appreciate_count
        )
        .outerjoin(models.Appreciates, models.Appreciates.response_id == models.Response.id)
        .filter(models.Response.post_id == post_id)
        .group_by(models.Response.id)
        .subquery()
    )

    res = (
        db.query(models.Response)
        .options(joinedload(models.Response.author))
        .join(counts_subq, counts_subq.c.response_id == models.Response.id)
        .order_by(counts_subq.c.appreciate_count.desc(), models.Response.created_at.desc())
    )

    if limit is not None:
        responses = res.limit(limit).all()
    else:
        responses = res.all()
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
            detail="User not found."
        )
    
    return toggle_appreciate(db, user.id, response_id=id)

@app.post("/posts/{id}/follow", response_model=schemas.FollowStatus, status_code=201)
def follow_post(id: int, db: Session = Depends(get_db),
                decoded_token: dict = Depends(verify_firebase_token)):
    uid = decoded_token["uid"]
    user = db.query(models.User).filter(models.User.uid == uid).first()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )
    
    existing_follow = db.query(models.PostFollow).filter(
        models.PostFollow.post_id == id,
        models.PostFollow.user_id == user.id
    ).first()

    if existing_follow:
        following = False
        db.query(models.PostFollow).filter(
            models.PostFollow.post_id == id,
            models.PostFollow.user_id == user.id
        ).delete(synchronize_session=False)
        db.commit()
    else:
        following = True
        new_follow = models.PostFollow(
            post_id=id,
            user_id=user.id
        )
        db.add(new_follow)
        db.commit()

    return {"following": following}

@app.get("/posts/{id}/follow_status", response_model=schemas.FollowStatus)
def get_post_follow_status(id: int, db: Session = Depends(get_db), decoded_token: dict = Depends(verify_firebase_token)):
    user_id = db.query(models.User.id).filter(models.User.uid == decoded_token["uid"]).scalar()
    
    following = db.query(models.PostFollow).filter(
        models.PostFollow.post_id == id,
        models.PostFollow.user_id == user_id
    ).first() is not None
    return {"following": following}

@app.get("/activity", response_model=schemas.ActivityOut)
def get_activity_feed(limit: int = 5, db: Session = Depends(get_db), decoded_token: dict = Depends(verify_firebase_token)):
    user_id = db.query(models.User.id).filter(models.User.uid == decoded_token["uid"]).scalar()

    posted = (select(models.Post.id.label("post_id"), models.Post.created_at).where(models.Post.user_id == user_id).order_by(models.Post.created_at.desc()).limit(limit))
    responded = (select(models.Response.post_id.label("post_id"), models.Response.created_at).where(models.Response.user_id == user_id).order_by(models.Response.created_at.desc()).limit(limit))
    followed = (select(models.PostFollow.post_id.label("post_id"), models.PostFollow.created_at).where(models.PostFollow.user_id == user_id).order_by(models.PostFollow.created_at.desc()).limit(limit))

    p = db.execute(posted)
    r = db.execute(responded)
    f = db.execute(followed)

    postsList = {}

    for post_id, created_at in p.all() + r.all() + f.all():
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        if post_id not in postsList or created_at > postsList[post_id]:
            postsList[post_id] = created_at

    sorted_posts = sorted(postsList.items(), key=lambda x: x[1], reverse=True)[:limit]
    post_ids = [post_id for post_id, _ in sorted_posts]

    if not post_ids:
        return schemas.ActivityOut(posts=[])

    posts = select(models.Post).where(models.Post.id.in_(post_ids)).limit(limit)
    result = db.execute(posts).scalars().all()

    res = {post.id: post for post in result}
    ordered_posts = [res[pid] for pid in post_ids if pid in res]
    return schemas.ActivityOut(posts=ordered_posts)