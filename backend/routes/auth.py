from fastapi import APIRouter, HTTPException, Body
from models.schemas import UserCreate, Token
from services.auth import create_user, authenticate_user, create_access_token

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(body: dict = Body(...)):
    user = UserCreate(**body)
    user_dict = await create_user(user)
    token = create_access_token({"sub": user_dict["email"]})
    return {"access_token": token, "token_type": "bearer", "user": user_dict}

@router.post("/login", response_model=Token)
async def login(body: dict = Body(...)):
    email = body.get("email")
    password = body.get("password")
    user = await authenticate_user(email, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user["email"]})
    return {"access_token": token, "token_type": "bearer", "user": user}
