from fastapi import APIRouter, Body
from database import patients_collection, results_collection, scenarios_collection
from services.algorithm import solve_knapsack, get_presets
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone

router = APIRouter()

def normalize_patient(p):
    """Normalize field names from either frontend format or DB format."""
    p['id'] = str(p.get('_id', p.get('id', '')))
    p.pop('_id', None)

    # Handle field name differences: frontend uses survivalScore/ventilator/medicine
    # backend/DB uses survival/vent/meds — normalize everything to survival/vent/meds
    if 'survivalScore' in p:
        p['survival'] = p.pop('survivalScore')
    if 'ventilator' in p:
        p['vent'] = p.pop('ventilator')
    if 'medicine' in p:
        p['meds'] = p.pop('medicine')

    return p

def try_object_id(pid):
    """Safely convert to ObjectId, return None if invalid."""
    try:
        return ObjectId(str(pid))
    except (InvalidId, TypeError):
        return None

@router.post("/solve")
async def solve_algorithm(body: dict = Body(...)):
    caps_raw = body.get("caps", {})
    patient_ids = body.get("patient_ids")

    # Normalize caps field names too
    # Frontend may send: ventilator/medicine, backend needs: vent/meds
    caps = {
        "icu":  caps_raw.get("icu", caps_raw.get("icu", 6)),
        "vent": caps_raw.get("vent", caps_raw.get("ventilator", 4)),
        "meds": caps_raw.get("meds", caps_raw.get("medicine", 10)),
    }

    if patient_ids:
        # Try converting to ObjectIds first
        object_ids = [oid for oid in [try_object_id(pid) for pid in patient_ids] if oid]

        if object_ids:
            # Real MongoDB ObjectIds — fetch by _id
            cursor = patients_collection.find({"_id": {"$in": object_ids}})
        else:
            # Simple IDs like 1,2,3 from initialPatients.js — fetch all instead
            cursor = patients_collection.find({})
    else:
        # No filter — fetch all patients
        cursor = patients_collection.find({})

    patients = [normalize_patient(p) async for p in cursor]

    # If DB is empty, return error with helpful message
    if not patients:
        return {
            "error": "No patients found. Please seed demo patients first.",
            "hint": "POST /api/patients/seed"
        }

    result = await solve_knapsack(patients, caps)

    # Save to history
    await results_collection.insert_one({
        "result": result,
        "caps": caps,
        "computedAt": datetime.now(timezone.utc)
    })

    return result


@router.get("/presets")
async def get_algorithm_presets():
    return await get_presets()


@router.post("/scenarios")
async def save_scenario(body: dict = Body(...)):
    name = body.get("name")
    caps = body.get("caps")
    doc = {"name": name, "caps": caps, "createdAt": datetime.now(timezone.utc)}
    result = await scenarios_collection.insert_one(doc)
    doc['id'] = str(result.inserted_id)
    doc.pop('_id', None)
    return doc


@router.get("/history")
async def get_algorithm_history():
    cursor = results_collection.find({}).sort("computedAt", -1).limit(10)
    history = []
    async for doc in cursor:
        r = doc.get("result", {})
        history.append(r)
    return history
