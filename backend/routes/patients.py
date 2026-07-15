from fastapi import APIRouter, HTTPException, Query
from database import patients_collection
from models.schemas import Patient, PatientCreate, PatientUpdate
from typing import List, Optional
from bson import ObjectId

router = APIRouter()

# Helper to convert MongoDB doc to Patient
def patient_from_doc(doc):
    doc['id'] = str(doc['_id'])
    doc.pop('_id', None)
    return doc

def safe_object_id(id: str):
    """Safely parse ObjectId — raises 404 instead of crashing on invalid IDs."""
    try:
        return ObjectId(id)
    except Exception:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Patient not found")

@router.get("/", response_model=List[Patient])
async def get_patients(condition: Optional[str] = Query(None), search: Optional[str] = Query(None), sort: Optional[str] = Query(None)):
    query = {}
    if condition:
        query['condition'] = condition
    if search:
        query['name'] = {'$regex': search, '$options': 'i'}
    cursor = patients_collection.find(query)
    if sort == 'survival':
        cursor = cursor.sort('survival', -1)
    patients = [patient_from_doc(doc) async for doc in cursor]
    return patients

@router.post("/", response_model=Patient)
async def create_patient(patient: PatientCreate):
    doc = patient.model_dump()  # Pydantic v2: use model_dump() instead of deprecated dict()
    result = await patients_collection.insert_one(doc)
    doc['id'] = str(result.inserted_id)
    return doc

@router.get("/{id}", response_model=Patient)
async def get_patient(id: str):
    doc = await patients_collection.find_one({'_id': safe_object_id(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient_from_doc(doc)

@router.patch("/{id}", response_model=Patient)
async def update_patient(id: str, patient: PatientUpdate):
    update = {k: v for k, v in patient.model_dump(exclude_unset=True).items()}  # Pydantic v2
    oid = safe_object_id(id)
    result = await patients_collection.update_one({'_id': oid}, {'$set': update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    doc = await patients_collection.find_one({'_id': oid})
    return patient_from_doc(doc)

@router.delete("/{id}")
async def delete_patient(id: str):
    result = await patients_collection.delete_one({'_id': safe_object_id(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"success": True}

@router.post("/reorder")
async def reorder_patients(patients: List[dict]):
    for p in patients:
        try:
            oid = ObjectId(p['id'])
            await patients_collection.update_one({'_id': oid}, {'$set': {'order': p['order']}})
        except Exception:
            pass  # skip invalid IDs gracefully
    return {"success": True}

@router.post("/seed")
async def seed_patients():
    demo = [
        {"name": "Arjun Sharma", "age": 67, "condition": "Critical", "survival": 9, "icu": 2, "vent": 1, "meds": 3, "order": 0},
        {"name": "Priya Patel", "age": 45, "condition": "Severe", "survival": 7, "icu": 1, "vent": 1, "meds": 2, "order": 1},
        {"name": "Rohan Gupta", "age": 34, "condition": "Moderate", "survival": 5, "icu": 1, "vent": 0, "meds": 2, "order": 2},
        {"name": "Ananya Reddy", "age": 72, "condition": "Critical", "survival": 8, "icu": 2, "vent": 1, "meds": 4, "order": 3},
        {"name": "Vikram Singh", "age": 55, "condition": "Stable", "survival": 4, "icu": 1, "vent": 0, "meds": 1, "order": 4}
    ]
    await patients_collection.delete_many({})
    await patients_collection.insert_many(demo)
    return {"success": True}
