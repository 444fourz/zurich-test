"""Pydantic schemas for API request and response validation."""

from pydantic import BaseModel, EmailStr
from typing import List, Optional


class PersonalDetailsSchema(BaseModel):
    """Personal details from step 1 of the application form."""
    firstName: str
    lastName: str
    dateOfBirth: str  # ISO format: YYYY-MM-DD
    email: EmailStr
    phone: str
    addressLine1: str
    addressLine2: Optional[str] = ""
    city: str
    postcode: str


class LifestyleSchema(BaseModel):
    """Lifestyle information from step 2 of the application form."""
    smoker: str  # never, former, current
    alcoholConsumption: str  # none, occasional, moderate, heavy
    exerciseFrequency: str  # none, occasional, regular, frequent
    occupation: str
    hazardousActivities: str  # none, some, high


class MedicalHistorySchema(BaseModel):
    """Medical history from step 3 of the application form."""
    height: str  # cm
    weight: str  # kg
    existingConditions: List[str]
    medications: Optional[str] = ""
    familyHistory: str  # none, some, significant
    recentHospitalisation: str  # yes, no


class ApplicationCreateSchema(BaseModel):
    """Complete application data from the frontend form."""
    personal: PersonalDetailsSchema
    lifestyle: LifestyleSchema
    medical: MedicalHistorySchema


class ApplicationResponseSchema(BaseModel):
    """Response after creating an application."""
    id: int
    reference: str
    status: str
    message: str
