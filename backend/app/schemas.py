"""Pydantic schemas for API request and response validation."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import List, Optional


class RegisterSchema(BaseModel):
    """Registration request."""
    model_config = ConfigDict(str_strip_whitespace=True)

    fullName: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginSchema(BaseModel):
    """Login request."""
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserSchema(BaseModel):
    """Public view of a user. Never includes the password hash."""
    id: int
    email: str
    fullName: str
    role: str


class TokenResponseSchema(BaseModel):
    """Returned after a successful login or registration."""
    accessToken: str
    user: UserSchema


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
