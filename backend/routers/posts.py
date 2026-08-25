from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from bson import ObjectId

router = APIRouter(prefix="/posts", tags=["posts"])

class CreatePostRequest(BaseModel):
    title: str
    content: str
    tags: List[str] = []

class PostResponse(BaseModel):
    id: str
    user_id: str
    title: str
    content: str
    tags: List[str]
    likes_count: int
    comments_count: int
    created_at: str

@router.post("/", response_model=PostResponse)
async def create_post(request: CreatePostRequest, user_id: str, db):
    """Create a new post"""
    post_doc = {
        "user_id": user_id,
        "title": request.title,
        "content": request.content,
        "tags": request.tags,
        "likes_count": 0,
        "comments_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await db.posts.insert_one(post_doc)
    post_doc["id"] = str(result.inserted_id)
    return post_doc

@router.get("/", response_model=List[PostResponse])
async def get_posts(skip: int = 0, limit: int = 20, db=None):
    """Get all posts (paginated)"""
    posts = await db.posts.find().skip(skip).limit(limit).to_list(limit)
    return [{
        "id": str(p["_id"]),
        "user_id": p["user_id"],
        "title": p["title"],
        "content": p["content"],
        "tags": p["tags"],
        "likes_count": p["likes_count"],
        "comments_count": p["comments_count"],
        "created_at": p["created_at"].isoformat()
    } for p in posts]

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: str, db):
    """Get a specific post"""
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return {
        "id": str(post["_id"]),
        "user_id": post["user_id"],
        "title": post["title"],
        "content": post["content"],
        "tags": post["tags"],
        "likes_count": post["likes_count"],
        "comments_count": post["comments_count"],
        "created_at": post["created_at"].isoformat()
    }

@router.delete("/{post_id}")
async def delete_post(post_id: str, user_id: str, db):
    """Delete a post (only by creator)"""
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.posts.delete_one({"_id": ObjectId(post_id)})
    return {"message": "Post deleted"}
