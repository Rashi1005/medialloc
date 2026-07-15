from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal, Any
from datetime import datetime

class PatientBase(BaseModel):
    name: str
    age: int
    condition: Literal['Critical', 'Severe', 'Moderate', 'Stable']
    survival: int = Field(..., ge=1, le=10)
    icu: int
    vent: int
    meds: int
    order: int

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str]
    age: Optional[int]
    condition: Optional[Literal['Critical', 'Severe', 'Moderate', 'Stable']]
    survival: Optional[int]
    icu: Optional[int]
    vent: Optional[int]
    meds: Optional[int]
    order: Optional[int]

class Patient(PatientBase):
    id: str

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class Caps(BaseModel):
    icu: int
    vent: int
    meds: int

class BacktrackNode(BaseModel):
    id: str
    depth: int
    score: int
    usedIcu: int
    usedVent: int
    usedMeds: int
    feasible: bool
    isLeaf: bool
    path: List[str]
    parentId: Optional[str]

class Complexity(BaseModel):
    n: int
    W: int
    V: int
    M: int
    dpOperations: int
    bruteForceOps: int
    speedup: float
    combinationsChecked: int

class AllocationResult(BaseModel):
    maxScore: int
    totalPossibleScore: int
    efficiency: float
    allocated: List[Patient]
    deferred: List[Patient]
    usedIcu: int
    usedVent: int
    usedMeds: int
    dpTable2d: List[List[int]]
    backtrackNodes: List[BacktrackNode]
    complexity: Complexity
    computedAt: datetime

class Scenario(BaseModel):
    name: str
    caps: Caps
    id: Optional[str]

class ReportRequest(BaseModel):
    hospital_name: Optional[str]
    date: Optional[datetime]
    allocation_result: AllocationResult

class ReorderRequest(BaseModel):
    patients: List[dict]

class SeedRequest(BaseModel):
    pass
