from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

# Workaround for SSL handshake error with MongoDB Atlas
client = AsyncIOMotorClient(settings.MONGODB_URI, tlsAllowInvalidCertificates=True)
db = client[settings.MONGODB_DB]

# Collections
patients_collection = db["patients"]
users_collection = db["users"]
results_collection = db["results"]
scenarios_collection = db["scenarios"]
