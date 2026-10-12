"""Database operations using raw SQL queries.

All functions use the get_connection() from backend/db/init_db.py to ensure
foreign keys are enforced.
"""

import sqlite3
import secrets
from pathlib import Path
from typing import Dict, Any, Optional

# Import the connection function from init_db
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from db.init_db import get_connection


def generate_reference() -> str:
    """Generate a unique application reference (e.g., APP-A1B2C3D4)."""
    return f"APP-{secrets.token_hex(4).upper()}"


def create_application(data: Dict[str, Any], db_path: Optional[Path] = None) -> Dict[str, Any]:
    """
    Create a complete application with all related data.
    
    This function:
    1. Creates a user (for now, without authentication - M1 will add proper auth)
    2. Creates an applicant record
    3. Creates an application
    4. Saves lifestyle data
    5. Saves medical data
    6. Saves medical conditions
    
    Returns the application ID and reference.
    """
    conn = get_connection(db_path) if db_path else get_connection()
    
    try:
        cursor = conn.cursor()
        
        # Extract data from nested structure
        personal = data["personal"]
        lifestyle = data["lifestyle"]
        medical = data["medical"]
        
        # Step 1: Create user (placeholder - M1 will add proper registration)
        # For now, we create a user with a dummy password hash
        cursor.execute(
            """
            INSERT INTO users (email, password_hash, full_name, role)
            VALUES (?, ?, ?, ?)
            """,
            (
                personal["email"],
                "PLACEHOLDER_HASH",  # M1: Replace with proper bcrypt hash
                f"{personal['firstName']} {personal['lastName']}",
                "applicant"
            )
        )
        user_id = cursor.lastrowid
        
        # Step 2: Create applicant
        cursor.execute(
            """
            INSERT INTO applicants (
                user_id, first_name, last_name, date_of_birth,
                email, phone, address_line1, address_line2, city, postcode
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                personal["firstName"],
                personal["lastName"],
                personal["dateOfBirth"],
                personal["email"],
                personal["phone"],
                personal["addressLine1"],
                personal["addressLine2"] or None,
                personal["city"],
                personal["postcode"]
            )
        )
        applicant_id = cursor.lastrowid
        
        # Step 3: Create application
        reference = generate_reference()
        cursor.execute(
            """
            INSERT INTO applications (reference, applicant_id, product, status)
            VALUES (?, ?, ?, ?)
            """,
            (reference, applicant_id, "standard_health", "draft")
        )
        application_id = cursor.lastrowid
        
        # Step 4: Save lifestyle data
        cursor.execute(
            """
            INSERT INTO application_lifestyle (
                application_id, smoker, alcohol_consumption,
                exercise_frequency, occupation, hazardous_activities
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                application_id,
                lifestyle["smoker"],
                lifestyle["alcoholConsumption"],
                lifestyle["exerciseFrequency"],
                lifestyle["occupation"],
                lifestyle["hazardousActivities"]
            )
        )
        
        # Step 5: Save medical data
        # Convert height and weight to float for database
        height_cm = float(medical["height"])
        weight_kg = float(medical["weight"])
        
        # Convert hospitalisation yes/no to 1/0
        hospitalisation = 1 if medical["recentHospitalisation"] == "yes" else 0
        
        cursor.execute(
            """
            INSERT INTO application_medical (
                application_id, height_cm, weight_kg, medications,
                family_history, recent_hospitalisation
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                application_id,
                height_cm,
                weight_kg,
                medical["medications"] or None,
                medical["familyHistory"],
                hospitalisation
            )
        )
        
        # Step 6: Save medical conditions
        # Get condition IDs from the lookup table
        conditions = medical["existingConditions"]
        
        # Filter out "None" - it means no conditions
        if "None" not in conditions and len(conditions) > 0:
            # Map frontend labels to database codes
            condition_map = {
                "Diabetes": "diabetes",
                "High blood pressure": "hypertension",
                "Heart disease": "heart_disease",
                "Asthma": "asthma",
                "Cancer (current or previous)": "cancer",
                "Mental health condition": "mental_health",
                "Other chronic condition": "other_chronic"
            }
            
            for condition_label in conditions:
                condition_code = condition_map.get(condition_label)
                if condition_code:
                    # Get the condition ID
                    cursor.execute(
                        "SELECT id FROM medical_conditions WHERE code = ?",
                        (condition_code,)
                    )
                    row = cursor.fetchone()
                    if row:
                        condition_id = row[0]
                        cursor.execute(
                            """
                            INSERT INTO application_conditions (application_id, condition_id)
                            VALUES (?, ?)
                            """,
                            (application_id, condition_id)
                        )
        
        conn.commit()
        
        return {
            "id": application_id,
            "reference": reference,
            "status": "draft",
            "applicant_id": applicant_id,
            "user_id": user_id
        }
        
    except sqlite3.IntegrityError as e:
        conn.rollback()
        # Check if it's a duplicate email
        if "email" in str(e).lower():
            raise ValueError("An account with this email already exists")
        raise
    except Exception as e:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_application(application_id: int, db_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """Retrieve an application by ID with all related data."""
    conn = get_connection(db_path) if db_path else get_connection()
    
    try:
        cursor = conn.cursor()
        
        # Get application basic info
        cursor.execute(
            """
            SELECT a.id, a.reference, a.status, a.submitted_at, a.created_at,
                   ap.first_name, ap.last_name, ap.email
            FROM applications a
            JOIN applicants ap ON a.applicant_id = ap.id
            WHERE a.id = ?
            """,
            (application_id,)
        )
        
        row = cursor.fetchone()
        if not row:
            return None
        
        return {
            "id": row[0],
            "reference": row[1],
            "status": row[2],
            "submitted_at": row[3],
            "created_at": row[4],
            "applicant_name": f"{row[5]} {row[6]}",
            "applicant_email": row[7]
        }
        
    finally:
        conn.close()
