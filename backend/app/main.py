"""FastAPI application for health insurance underwriting.

This is the main entry point for the backend API.
"""

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import Any, Dict
import sys

# Add parent directory to path to import from db module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.auth import (
    DUMMY_HASH,
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.config import settings
from app.crud import (
    create_application,
    create_user,
    get_application,
    get_user_by_email,
    log_audit,
)
from app.schemas import (
    ApplicationCreateSchema,
    ApplicationResponseSchema,
    LoginSchema,
    RegisterSchema,
    TokenResponseSchema,
    UserSchema,
)

DB_PATH = Path(settings.database_path)

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


def _to_user_schema(user: Dict[str, Any]) -> UserSchema:
    return UserSchema(
        id=user["id"],
        email=user["email"],
        fullName=user["full_name"],
        role=user["role"],
    )


def _token_response(user: Dict[str, Any]) -> TokenResponseSchema:
    return TokenResponseSchema(
        accessToken=create_access_token(user),
        user=_to_user_schema(user),
    )


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "underwriting-api"}


@app.post("/auth/register", response_model=TokenResponseSchema, status_code=201)
def register(payload: RegisterSchema):
    """Create an applicant account and log the user in."""
    try:
        user = create_user(
            email=payload.email,
            password_hash=hash_password(payload.password),
            full_name=payload.fullName,
            db_path=DB_PATH,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    log_audit("auth.register", "user", user["id"], actor_user_id=user["id"], db_path=DB_PATH)
    return _token_response(user)


@app.post("/auth/login", response_model=TokenResponseSchema)
def login(payload: LoginSchema):
    """Check credentials and return an access token."""
    user = get_user_by_email(payload.email, db_path=DB_PATH)

    # Always verify a hash so unknown emails take as long as known ones.
    password_ok = verify_password(
        payload.password, user["password_hash"] if user else DUMMY_HASH
    )

    if not user or not password_ok or not user["is_active"]:
        log_audit(
            "auth.login_failed",
            "user",
            user["id"] if user else None,
            db_path=DB_PATH,
        )
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    log_audit("auth.login", "user", user["id"], actor_user_id=user["id"], db_path=DB_PATH)
    return _token_response(user)


@app.post("/auth/logout", status_code=204)
def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Record a logout. Tokens are stateless, so the client discards its copy."""
    log_audit(
        "auth.logout", "user", current_user["id"],
        actor_user_id=current_user["id"], db_path=DB_PATH,
    )


@app.get("/auth/me", response_model=UserSchema)
def me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Return the logged-in user."""
    return _to_user_schema(current_user)


@app.post("/applications", response_model=ApplicationResponseSchema)
def submit_application(
    application: ApplicationCreateSchema,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Submit a new health insurance application for the logged-in user.

    This endpoint:
    1. Validates the application data
    2. Creates or updates the user's applicant record
    3. Saves the application with all related data
    4. Returns the application reference
    """
    try:
        # Convert Pydantic model to dict for database operations
        data = application.model_dump()

        # Create the application in the database
        result = create_application(data, user_id=current_user["id"], db_path=DB_PATH)

        return ApplicationResponseSchema(
            id=result["id"],
            reference=result["reference"],
            status=result["status"],
            message=f"Application {result['reference']} created successfully"
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log the error in production
        print(f"Error creating application: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your application"
        )


@app.get("/applications/{application_id}")
def get_application_details(
    application_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Retrieve application details by ID.

    Applicants can only see their own applications. This is a placeholder for
    M2; full implementation will include all application data.
    """
    result = get_application(application_id, db_path=DB_PATH)

    # Return 404 rather than 403 so other people's IDs aren't revealed.
    if not result:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user["role"] == "applicant" and result["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Application not found")

    result.pop("user_id", None)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
