# Health Insurance Underwriting System

A web application for submitting and assessing health insurance applications online.

**Target Market:** United Kingdom (GDPR, FCA)

## Prerequisites

- Python 3.11+
- Node.js 18+
- SQLite 3

## Setup Instructions

### 1. Database Setup

Create the SQLite database from the schema:

```bash
python backend/db/init_db.py
```

This creates `backend/underwriting.db` with all tables, constraints, and triggers.

### 2. Backend Setup

Install Python dependencies:

```bash
pip install -r backend/requirements.txt
```

Copy the environment template:

```bash
copy backend\.env.example backend\.env
```

Start the backend server:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### 3. Frontend Setup

Install Node.js dependencies:

```bash
cd frontend
npm install
```

Copy the environment template:

```bash
copy frontend\.env.example frontend\.env
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. Navigate to `http://localhost:5173`
2. Click "Apply for cover"
3. Complete the 4-step application form:
   - Personal details
   - Lifestyle information
   - Medical history
   - Review and submit
4. Your application reference will be displayed on submission

## Project Structure

```
backend/
  app/
    main.py          # FastAPI application
    schemas.py       # Pydantic models for validation
    crud.py          # Database operations (raw SQL)
  db/
    schema.sql       # Database schema
    init_db.py       # Database initialization
  .env              # Environment configuration (git-ignored)
  requirements.txt  # Python dependencies

frontend/
  src/
    pages/          # React page components
    api/            # API client
  .env             # Environment configuration (git-ignored)
  package.json     # Node.js dependencies

docs/
  PLAN.md          # Project plan and architecture
```

## Development Notes

- **Database:** SQLite for development, PostgreSQL planned for production (M5)
- **Authentication:** Placeholder implementation - proper auth coming in M1
- **Data Protection:** No health data is logged to console (GDPR compliance)
- **Testing:** Coming in M0 (pytest for backend, Vitest for frontend)

## Current Status

- ✅ Multi-step application form (M2)
- ✅ Database schema with constraints and triggers
- ✅ Backend API for application submission
- ✅ Frontend-to-database data flow
- ⏳ Authentication (M1)
- ⏳ Risk assessment rules engine (M3)
- ⏳ Underwriter tools (M4)
