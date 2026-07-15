import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB: str = os.getenv("MONGODB_DB", "medialloc")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "supersecret")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    HOSPITAL_NAME: str = os.getenv("HOSPITAL_NAME", "MediAlloc Hospital")

settings = Settings()
