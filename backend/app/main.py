"""FastAPI application for health insurance underwriting.

This is the main entry point for the backend API.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from pathlib import Path
import sys

# Add parent directory to path to import from db module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.schemas import ApplicationCreateSchema, ApplicationResponseSchema
from app.crud import create_application, get_application


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173"
    database_path: str = "backend/underwriting.db"
    
    class Config:
        env_file = "backend/.env"
        env_file_encoding = "utf-8"


settings = Settings()

# Create FastAPI app
app = FastAPI(
    title="Health Insurance Underwriting API",
    description="API for submitting and managing health insurance applications",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "underwriting-api"}


@app.post("/applications", response_model=ApplicationResponseSchema)
def submit_application(application: ApplicationCreateSchema):
    """
    Submit a new health insurance application.
    
    This endpoint:
    1. Validates the application data
    2. Creates user and applicant records
    3. Saves the application with all related data
    4. Returns the application reference
    
    Note: This is a simplified version for M0/M2. M1 will add proper
    authentication, and the user creation will move to a separate registration flow.
    """
    try:
        # Convert Pydantic model to dict for database operations
        data = application.model_dump()
        
        # Create the application in the database
        result = create_application(data, db_path=Path(settings.database_path))
        
        return ApplicationResponseSchema(
            id=result["id"],
            reference=result["reference"],
            status=result["status"],
            message=f"Application {result['reference']} created successfully"
        )
        
    except ValueError as e:
        # Handle duplicate email or validation errors
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log the error in production
        print(f"Error creating application: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your application"
        )


@app.get("/applications/{application_id}")
def get_application_details(application_id: int):
    """
    Retrieve application details by ID.
    
    This is a placeholder for M2. Full implementation will include
    all application data and require authentication.
    """
    result = get_application(application_id, db_path=Path(settings.database_path))
    
    if not result:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
