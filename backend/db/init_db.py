"""Create the SQLite database from schema.sql.

Usage:
    python backend/db/init_db.py            # create tables if they don't exist
    python backend/db/init_db.py --reset    # delete the database and rebuild it
"""

import argparse
import sqlite3
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent
SCHEMA_PATH = DB_DIR / "schema.sql"
DEFAULT_DB_PATH = DB_DIR.parent / "underwriting.db"


def get_connection(db_path: Path = DEFAULT_DB_PATH) -> sqlite3.Connection:
    """Open a connection with foreign keys enforced (SQLite has them off by default)."""
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db(db_path: Path = DEFAULT_DB_PATH, reset: bool = False) -> None:
    if reset and db_path.exists():
        db_path.unlink()

    schema = SCHEMA_PATH.read_text(encoding="utf-8")

    with get_connection(db_path) as connection:
        connection.execute("PRAGMA journal_mode = WAL")
        connection.executescript(schema)


def main() -> None:
    parser = argparse.ArgumentParser(description="Initialise the underwriting database.")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB_PATH, help="database file path")
    parser.add_argument("--reset", action="store_true", help="delete and rebuild the database")
    args = parser.parse_args()

    init_db(args.db, reset=args.reset)
    print(f"Database ready at {args.db}")


if __name__ == "__main__":
    main()
