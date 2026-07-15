from fastapi import APIRouter, Body, Response
from services.report import generate_pdf_report, generate_txt_report, generate_csv_report
from database import patients_collection
from config import settings

router = APIRouter()

@router.post("/pdf")
async def create_pdf_report(body: dict = Body(...)):
    hospital_name = settings.HOSPITAL_NAME
    allocation_result = body.get("allocation_result")
    pdf_bytes = generate_pdf_report(hospital_name, allocation_result)
    return Response(content=pdf_bytes, media_type="application/pdf")

@router.post("/txt")
async def create_txt_report(body: dict = Body(...)):
    hospital_name = settings.HOSPITAL_NAME
    allocation_result = body.get("allocation_result")
    txt = generate_txt_report(hospital_name, allocation_result)
    return Response(content=txt, media_type="text/plain")

@router.post("/csv")
async def create_csv_report():
    patients = [patient async for patient in patients_collection.find({})]
    for p in patients:
        p['status'] = "ALLOCATED" if p.get('allocated', False) else "PENDING"
    csv_str = generate_csv_report(patients)
    return Response(content=csv_str, media_type="text/csv")
