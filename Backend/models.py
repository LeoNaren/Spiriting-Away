from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, CheckConstraint, Index, BigInteger
from sqlalchemy.sql.expression import text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    uid = Column(String, index=False, unique=True, nullable=False)
    name = Column(String, nullable=True)
    username = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="author", cascade="all, delete-orphan")
    appreciates = relationship("Appreciates", back_populates="user", cascade="all, delete-orphan")

class Post(Base):
    __tablename__ = "posts"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    author = relationship("User", back_populates="posts")
    responses = relationship("Response", back_populates="post", cascade="all, delete-orphan")
    appreciates = relationship("Appreciates", back_populates="post", cascade="all, delete-orphan")

class Response(Base):
    __tablename__ = "responses"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    post_id = Column(BigInteger, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_response_id = Column(BigInteger, ForeignKey("responses.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    post = relationship("Post", back_populates="responses")
    author = relationship("User", back_populates="responses")
    parent_response = relationship("Response", remote_side=[id], back_populates="responses")
    responses = relationship("Response", back_populates="parent_response", cascade="all, delete-orphan")
    appreciates = relationship("Appreciates", back_populates="response", cascade="all, delete-orphan")

class Appreciates(Base):
    __tablename__ = "appreciates"

    post_id = Column(BigInteger, ForeignKey("posts.id", ondelete="CASCADE"), nullable=True, index=True, primary_key=True)
    response_id = Column(BigInteger, ForeignKey("responses.id", ondelete="CASCADE"), nullable=True, index=True, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            """
            (post_id IS NOT NULL AND response_id IS NULL)
            OR 
            (post_id IS NULL AND response_id IS NOT NULL)
            """,
            name="check_appreciate_target"
        ),
        Index("ux_post_appreciate", "user_id", "post_id",
              unique=True, postgresql_where=text("post_id IS NOT NULL")),
        Index("ux_response_appreciate", "user_id", "response_id",
              unique=True, postgresql_where=text("response_id IS NOT NULL")),
    )

    user = relationship("User", back_populates="appreciates")
    post = relationship("Post", back_populates="appreciates")
    response = relationship("Response", back_populates="appreciates")