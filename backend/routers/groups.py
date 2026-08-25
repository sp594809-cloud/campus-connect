from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import List
from bson import ObjectId

router = APIRouter(prefix="/groups", tags=["groups"])

class CreateGroup(BaseModel):
    name: str
    description: str
    category: str  # study, sports, club, etc

class GroupResponse(BaseModel):
    id: str
    creator_id: str
    name: str
    description: str
    category: str
    members_count: int
    created_at: str

@router.post("/", response_model=GroupResponse)
async def create_group(request: CreateGroup, user_id: str, db):
    """Create a new group"""
    group_doc = {
        "creator_id": user_id,
        "name": request.name,
        "description": request.description,
        "category": request.category,
        "members": [user_id],
        "members_count": 1,
        "created_at": datetime.utcnow()
    }
    result = await db.groups.insert_one(group_doc)
    return {
        "id": str(result.inserted_id),
        "creator_id": user_id,
        "name": request.name,
        "description": request.description,
        "category": request.category,
        "members_count": 1,
        "created_at": datetime.utcnow().isoformat()
    }

@router.get("/", response_model=List[GroupResponse])
async def get_groups(category: str = None, skip: int = 0, limit: int = 20, db=None):
    """Get all groups (filter by category)"""
    query = {"category": category} if category else {}
    groups = await db.groups.find(query).skip(skip).limit(limit).to_list(limit)
    return [{
        "id": str(g["_id"]),
        "creator_id": g["creator_id"],
        "name": g["name"],
        "description": g["description"],
        "category": g["category"],
        "members_count": g["members_count"],
        "created_at": g["created_at"].isoformat()
    } for g in groups]

@router.post("/{group_id}/join")
async def join_group(group_id: str, user_id: str, db):
    """Join a group"""
    group = await db.groups.find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if user_id not in group["members"]:
        await db.groups.update_one(
            {"_id": ObjectId(group_id)},
            {"$push": {"members": user_id}, "$inc": {"members_count": 1}}
        )
    return {"message": "Joined group"}
