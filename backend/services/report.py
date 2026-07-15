from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO, StringIO
from models.schemas import AllocationResult
from datetime import datetime, timezone
import csv

def generate_pdf_report(hospital_name: str, allocation_result: dict) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, f"{hospital_name} Allocation Report")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, f"Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    c.drawString(50, height - 110, f"Efficiency: {allocation_result['efficiency']}%")
    c.drawString(50, height - 130, f"Algorithm: 0/1 Knapsack — Multi-dimensional")
    c.drawString(50, height - 150, f"Speedup: {allocation_result['complexity']['speedup']}x")
    c.drawString(50, height - 170, f"Computation: {allocation_result['complexity']['dpOperations']} ops vs {allocation_result['complexity']['bruteForceOps']} ops")
    # Allocated Patients Table
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 200, "Allocated Patients:")
    c.setFont("Helvetica", 10)
    y = height - 220
    c.drawString(50, y, "Name    Age    Condition    Survival    ICU    Vent    Meds")
    y -= 20
    for p in allocation_result['allocated']:
        c.drawString(50, y, f"{p['name']}    {p['age']}    {p['condition']}    {p['survival']}    {p['icu']}    {p['vent']}    {p['meds']}")
        y -= 15
    # Pending Patients Table
    y -= 20
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "Pending Patients:")
    y -= 20
    c.setFont("Helvetica", 10)
    c.drawString(50, y, "Name    Age    Condition    Survival    ICU    Vent    Meds")
    y -= 20
    for p in allocation_result['deferred']:
        c.drawString(50, y, f"{p['name']}    {p['age']}    {p['condition']}    {p['survival']}    {p['icu']}    {p['vent']}    {p['meds']}")
        y -= 15
    # Resource Utilization Bars
    y -= 30
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, f"Resource Utilization:")
    y -= 20
    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"ICU: {allocation_result['usedIcu']} / {allocation_result['complexity']['W']}")
    y -= 15
    c.drawString(50, y, f"Ventilators: {allocation_result['usedVent']} / {allocation_result['complexity']['V']}")
    y -= 15
    c.drawString(50, y, f"Medicines: {allocation_result['usedMeds']} / {allocation_result['complexity']['M']}")
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()

def generate_txt_report(hospital_name: str, allocation_result: dict) -> str:
    lines = [f"{hospital_name} Allocation Report", f"Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", f"Efficiency: {allocation_result['efficiency']}%", f"Algorithm: 0/1 Knapsack — Multi-dimensional", f"Speedup: {allocation_result['complexity']['speedup']}x", f"Computation: {allocation_result['complexity']['dpOperations']} ops vs {allocation_result['complexity']['bruteForceOps']} ops", "", "Allocated Patients:"]
    lines.append("Name,Age,Condition,Survival,ICU,Vent,Meds")
    for p in allocation_result['allocated']:
        lines.append(f"{p['name']},{p['age']},{p['condition']},{p['survival']},{p['icu']},{p['vent']},{p['meds']}")
    lines.append("")
    lines.append("Pending Patients:")
    lines.append("Name,Age,Condition,Survival,ICU,Vent,Meds")
    for p in allocation_result['deferred']:
        lines.append(f"{p['name']},{p['age']},{p['condition']},{p['survival']},{p['icu']},{p['vent']},{p['meds']}")
    lines.append("")
    lines.append(f"Resource Utilization:")
    lines.append(f"ICU: {allocation_result['usedIcu']} / {allocation_result['complexity']['W']}")
    lines.append(f"Ventilators: {allocation_result['usedVent']} / {allocation_result['complexity']['V']}")
    lines.append(f"Medicines: {allocation_result['usedMeds']} / {allocation_result['complexity']['M']}")
    return "\n".join(lines)

def generate_csv_report(patients: list) -> str:
    output = StringIO()  # csv.writer needs text mode, not binary BytesIO
    writer = csv.writer(output)
    writer.writerow(["Name", "Age", "Condition", "Survival", "ICU", "Vent", "Meds", "Status"])
    for p in patients:
        status = "ALLOCATED" if p.get("allocated", False) else "PENDING"
        writer.writerow([p["name"], p["age"], p["condition"], p["survival"], p["icu"], p["vent"], p["meds"], status])
    return output.getvalue()  # StringIO.getvalue() already returns str — no .decode() needed
