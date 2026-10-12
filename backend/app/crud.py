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


def _connect(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """Open a connection to the given database, or the default one."""
    return get_connection(db_path) if db_path else get_connection()


def generate_reference() -> str:
    """Generate a unique application reference (e.g., APP-A1B2C3D4)."""
    return f"APP-{secrets.token_hex(4).upper()}"


# ---------------------------------------------------------------------------
# Users and audit log
# ---------------------------------------------------------------------------

def create_user(
    email: str,
    password_hash: str,
    full_name: str,
    role: str = "applicant",
    db_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """Create a user. Raises ValueError if the email is already registered."""
    conn = _connect(db_path)
    try:
        cursor = conn.execute(
            """
            INSERT INTO users (email, password_hash, full_name, role)
            VALUES (?, ?, ?, ?)
            """,
            (email, password_hash, full_name, role),
        )
        conn.commit()
        return {
            "id": cursor.lastrowid,
            "email": email,
            "full_name": full_name,
            "role": role,
            "is_active": 1,
        }
    except sqlite3.IntegrityError:
        conn.rollback()
        raise ValueError("An account with this email already exists")
    finally:
        conn.close()


def get_user_by_email(email: str, db_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """Look up a user by email (case-insensitive), including the password hash."""
    conn = _connect(db_path)
    try:
        row = conn.execute(
            """
            SELECT id, email, password_hash, full_name, role, is_active
            FROM users WHERE email = ?
            """,
            (email,),
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_user_by_id(user_id: int, db_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """Look up a user by ID. The password hash is not included."""
    conn = _connect(db_path)
    try:
        row = conn.execute(
            "SELECT id, email, full_name, role, is_active FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def log_audit(
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    actor_user_id: Optional[int] = None,
    db_path: Optional[Path] = None,
) -> None:
    """Append an entry to the audit log. Never pass health data or passwords."""
    conn = _connect(db_path)
    try:
        conn.execute(
            """
            INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id)
            VALUES (?, ?, ?, ?)
            """,
            (actor_user_id, action, entity_type, entity_id),
        )
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------

def create_application(
    data: Dict[str, Any], user_id: int, db_path: Optional[Path] = None
) -> Dict[str, Any]:
    """
    Create a complete application for an existing, logged-in user.

    This function:
    1. Creates the user's applicant record, or updates it if one exists
    2. Creates an application
    3. Saves lifestyle data
    4. Saves medical data
    5. Saves medical conditions

    Returns the application ID and reference.
    """
    conn = _connect(db_path)

    try:
        cursor = conn.cursor()

        # Extract data from nested structure
        personal = data["personal"]
        lifestyle = data["lifestyle"]
        medical = data["medical"]

        # Step 1: Create or update the applicant (one per user)
        applicant_values = (
            personal["firstName"],
            personal["lastName"],
            personal["dateOfBirth"],
            personal["email"],
            personal["phone"],
            personal["addressLine1"],
            personal["addressLine2"] or None,
            personal["city"],
            personal["postcode"],
        )
        existing = cursor.execute(
            "SELECT id FROM applicants WHERE user_id = ?", (user_id,)
        ).fetchone()

        if existing:
            applicant_id = existing[0]
            cursor.execute(
                """
                UPDATE applicants SET
                    first_name = ?, last_name = ?, date_of_birth = ?, email = ?,
                    phone = ?, address_line1 = ?, address_line2 = ?, city = ?,
                    postcode = ?
                WHERE id = ?
                """,
                (*applicant_values, applicant_id),
            )
        else:
            cursor.execute(
                """
                INSERT INTO applicants (
                    user_id, first_name, last_name, date_of_birth,
                    email, phone, address_line1, address_line2, city, postcode
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, *applicant_values),
            )
            applicant_id = cursor.lastrowid

        # Step 2: Create application
        reference = generate_reference()
        cursor.execute(
            """
            INSERT INTO applications (reference, applicant_id, product, status)
            VALUES (?, ?, ?, ?)
            """,
            (reference, applicant_id, "standard_health", "draft")
        )
        application_id = cursor.lastrowid

        # Step 3: Save lifestyle data
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

        # Step 4: Save medical data
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

        # Step 5: Save medical conditions
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

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_application(application_id: int, db_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """Retrieve an application by ID with all related data."""
    conn = _connect(db_path)

    try:
        cursor = conn.cursor()

        # Get application basic info
        cursor.execute(
            """
            SELECT a.id, a.reference, a.status, a.submitted_at, a.created_at,
                   ap.first_name, ap.last_name, ap.email, ap.user_id
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
            "applicant_email": row[7],
            "user_id": row[8]
        }

    finally:
        conn.close()
