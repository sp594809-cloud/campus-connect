from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from bson import ObjectId

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

class Item(BaseModel):
    title: str
    description: str
    price: float
    category: str  # books, notes, electronics, etc
    images: List[str] = []

class ItemResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    price: float
    category: str
    images: List[str]
    status: str  # available, sold
    created_at: str

@router.post("/items", response_model=ItemResponse)
async def create_item(request: Item, user_id: str, db):
    """Create a marketplace listing"""
    item_doc = {
        "user_id": user_id,
        "title": request.title,
        "description": request.description,
        "price": request.price,
        "category": request.category,
        "images": request.images,
        "status": "available",
        "created_at": datetime.utcnow()
    }
    result = await db.marketplace.insert_one(item_doc)
    return {
        "id": str(result.inserted_id),
        "user_id": user_id,
        "title": request.title,
        "description": request.description,
        "price": request.price,
        "category": request.category,
        "images": request.images,
        "status": "available",
        "created_at": datetime.utcnow().isoformat()
    }

@router.get("/items", response_model=List[ItemResponse])
async def get_items(category: Optional[str] = None, skip: int = 0, limit: int = 20, db=None):
    """Get marketplace items (filter by category)"""
    query = {"category": category, "status": "available"} if category else {"status": "available"}
    items = await db.marketplace.find(query).skip(skip).limit(limit).to_list(limit)
    return [{
        "id": str(i["_id"]),
        "user_id": i["user_id"],
        "title": i["title"],
        "description": i["description"],
        "price": i["price"],
        "category": i["category"],
        "images": i["images"],
        "status": i["status"],
        "created_at": i["created_at"].isoformat()
    } for i in items]
