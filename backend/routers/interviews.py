from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from bson import ObjectId

router = APIRouter(prefix="/interviews", tags=["interviews"])

class InterviewExperience(BaseModel):
    company: str
    position: str
    experience: str
    difficulty: str  # easy, medium, hard
    questions: List[str] = []
    tips: str = ""

class InterviewResponse(BaseModel):
    id: str
    user_id: str
    company: str
    position: str
    experience: str
    difficulty: str
    questions: List[str]
    tips: str
    created_at: str

@router.post("/", response_model=InterviewResponse)
async def create_interview(request: InterviewExperience, user_id: str, db):
    """Share an interview experience"""
    interview_doc = {
        "user_id": user_id,
        "company": request.company,
        "position": request.position,
        "experience": request.experience,
        "difficulty": request.difficulty,
        "questions": request.questions,
        "tips": request.tips,
        "created_at": datetime.utcnow()
    }
    result = await db.interviews.insert_one(interview_doc)
    return {
        "id": str(result.inserted_id),
        "user_id": user_id,
        "company": request.company,
        "position": request.position,
        "experience": request.experience,
        "difficulty": request.difficulty,
        "questions": request.questions,
        "tips": request.tips,
        "created_at": datetime.utcnow().isoformat()
    }

@router.get("/", response_model=List[InterviewResponse])
async def get_interviews(company: Optional[str] = None, skip: int = 0, limit: int = 20, db=None):
    """Get interview experiences (filter by company)"""
    query = {"company": company} if company else {}
    interviews = await db.interviews.find(query).skip(skip).limit(limit).to_list(limit)
    return [{
        "id": str(i["_id"]),
        "user_id": i["user_id"],
        "company": i["company"],
        "position": i["position"],
        "experience": i["experience"],
        "difficulty": i["difficulty"],
        "questions": i["questions"],
        "tips": i["tips"],
        "created_at": i["created_at"].isoformat()
    } for i in interviews]
