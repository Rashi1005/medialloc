from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from models.schemas import User, UserCreate, Token
from database import users_collection
from config import settings
from typing import Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def get_user_by_email(email: str) -> Optional[dict]:
    return await users_collection.find_one({"email": email})

async def create_user(user: UserCreate) -> dict:
    hashed_pw = pwd_context.hash(user.password)
    user_dict = user.model_dump()  # Pydantic v2: use model_dump() instead of deprecated dict()
    user_dict["password"] = hashed_pw
    result = await users_collection.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    user_dict.pop("password")
    return user_dict

async def authenticate_user(email: str, password: str) -> Optional[dict]:
    user = await get_user_by_email(email)
    if not user:
        return None
    if not pwd_context.verify(password, user["password"]):
        return None
    user["id"] = str(user["_id"])
    user.pop("password")
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        user = await get_user_by_email(email)
        if user:
            user["id"] = str(user["_id"])
            user.pop("password", None)
        return user
    except JWTError:
        return None
