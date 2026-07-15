# MediAlloc Backend

## Setup Steps

1. Clone the repo and navigate to `backend/`:

   ```bash
   cd medialloc/backend
   ```

2. Create a virtual environment and activate it:

   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Copy `.env.example` to `.env` and edit as needed:

   ```bash
   cp .env.example .env
   ```

5. Start MongoDB locally (default URI: `mongodb://localhost:27017`).

6. Run the backend server:

   ```bash
   uvicorn main:app --reload
   ```

## Running Frontend & Backend Together

- Backend: http://localhost:8000
- Frontend: http://localhost:3000 or http://localhost:5173

## API Endpoints (curl examples)

### Auth

- Register:
  ```bash
  curl -X POST http://localhost:8000/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com","password":"testpass"}'
  ```
- Login:
  ```bash
  curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"testpass"}'
  ```

### Patients

- Get all patients:
  ```bash
  curl http://localhost:8000/api/patients
  ```
- Create patient:
  ```bash
  curl -X POST http://localhost:8000/api/patients -H "Content-Type: application/json" -d '{"name":"Arjun Sharma","age":67,"condition":"Critical","survival":9,"icu":2,"vent":1,"meds":3,"order":0}'
  ```
- Get single patient:
  ```bash
  curl http://localhost:8000/api/patients/{id}
  ```
- Update patient:
  ```bash
  curl -X PATCH http://localhost:8000/api/patients/{id} -H "Content-Type: application/json" -d '{"survival":10}'
  ```
- Delete patient:
  ```bash
  curl -X DELETE http://localhost:8000/api/patients/{id}
  ```
- Reorder patients:
  ```bash
  curl -X POST http://localhost:8000/api/patients/reorder -H "Content-Type: application/json" -d '[{"id":"...","order":0},...]'
  ```
- Seed demo patients:
  ```bash
  curl -X POST http://localhost:8000/api/patients/seed
  ```

### Algorithm

- Solve allocation:
  ```bash
  curl -X POST http://localhost:8000/api/algorithm/solve -H "Content-Type: application/json" -d '{"caps":{"icu":6,"vent":4,"meds":10}}'
  ```
- Get presets:
  ```bash
  curl http://localhost:8000/api/algorithm/presets
  ```
- Save scenario:
  ```bash
  curl -X POST http://localhost:8000/api/algorithm/scenarios -H "Content-Type: application/json" -d '{"name":"Custom Scenario","caps":{"icu":5,"vent":3,"meds":7}}'
  ```
- Get history:
  ```bash
  curl http://localhost:8000/api/algorithm/history
  ```

### Reports

- PDF report:
  ```bash
  curl -X POST http://localhost:8000/api/reports/pdf -H "Content-Type: application/json" -d '{"allocation_result":{...}}' --output report.pdf
  ```
- TXT report:
  ```bash
  curl -X POST http://localhost:8000/api/reports/txt -H "Content-Type: application/json" -d '{"allocation_result":{...}}' --output report.txt
  ```
- CSV report:
  ```bash
  curl -X POST http://localhost:8000/api/reports/csv --output patients.csv
  ```

---

For full API details, see the FastAPI docs at http://localhost:8000/docs
