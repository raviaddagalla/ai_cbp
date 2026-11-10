"""
SignBridge SQLite Database
==========================
Stores translation history using Python's built-in sqlite3 module.
No external ORM. Simple and transparent.
"""

import sqlite3
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "signbridge.db")


def get_connection() -> sqlite3.Connection:
    """Return a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # enables dict-like access
    return conn


def init_db() -> None:
    """Create the history table if it doesn't exist."""
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                sign_sequence TEXT    NOT NULL,
                confidence    REAL    NOT NULL,
                timestamp     TEXT    NOT NULL
            )
        """)
        conn.commit()


# Ensure table exists upon module import
init_db()


def save_translation(sign_sequence: str, confidence: float) -> int:
    """Insert a new translation record. Returns the new row id."""
    timestamp = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO history (sign_sequence, confidence, timestamp) VALUES (?, ?, ?)",
            (sign_sequence, confidence, timestamp),
        )
        conn.commit()
        return cursor.lastrowid


def get_history(limit: int = 50) -> list:
    """Fetch the most recent translation records."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM history ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [dict(row) for row in rows]


def clear_history() -> None:
    """Delete all history records."""
    with get_connection() as conn:
        conn.execute("DELETE FROM history")
        conn.commit()
