from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import os

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    college: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: str, expires_delta: timedelta = None):
    if expires_delta is None:
        expires_delta = timedelta(days=7)
    
    expire = datetime.utcnow() + expires_delta
    to_encode = {"sub": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignUpRequest, db):
    """Create new student account"""
    # Check if email already exists
    existing = await db.users.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Create new user
    user_doc = {
        "email": request.email,
        "password": hash_password(request.password),
        "full_name": request.full_name,
        "college": request.college,
        "created_at": datetime.utcnow(),
        "avatar_url": None,
        "bio": ""
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    token = create_access_token(user_id)
    return {"access_token": token, "token_type": "bearer", "user_id": user_id}

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db):
    """Login with email and password"""
    user = await db.users.find_one({"email": request.email})
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    token = create_access_token(user_id)
    return {"access_token": token, "token_type": "bearer", "user_id": user_id}
