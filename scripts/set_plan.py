#!/usr/bin/env python3
"""
Admin script to set user plan.
Usage: python scripts/set_plan.py <email> <plan>
Example: python scripts/set_plan.py user@example.com premium

Reads DATABASE_URL from environment. Does NOT print sensitive values.
"""

import os
import sys
import asyncio

# Validate args before any imports that might fail
if len(sys.argv) != 3:
    print("Usage: python scripts/set_plan.py <email> <plan>")
    print("  <plan> must be 'free' or 'premium'")
    sys.exit(1)

email = sys.argv[1]
plan = sys.argv[2].lower()

if plan not in ("free", "premium"):
    print(f"Error: Invalid plan '{plan}'. Must be 'free' or 'premium'.")
    sys.exit(1)

# Build DATABASE_URL from individual env vars (same as app/core/config.py)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "shortener_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "shortener_pass_123")
DB_NAME = os.getenv("DB_NAME", "shortener")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Only import after we know args are valid
try:
    import asyncpg
except ImportError:
    print("Error: asyncpg not installed. Run: pip install asyncpg")
    sys.exit(1)


async def set_plan(email: str, plan: str) -> None:
    print(f"Connecting to database...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
    except Exception as e:
        print(f"Error connecting to database: {e}")
        print("Hint: Make sure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME are set correctly.")
        sys.exit(1)

    try:
        # Check if user exists
        row = await conn.fetchrow("SELECT id, email, plan FROM users WHERE email = $1", email)
        if not row:
            print(f"Error: User '{email}' not found.")
            await conn.close()
            sys.exit(1)

        old_plan = row["plan"]
        if old_plan == plan:
            print(f"User '{email}' already has plan '{plan}'. No changes made.")
            await conn.close()
            return

        # Update plan
        await conn.execute("UPDATE users SET plan = $1 WHERE email = $2", plan, email)
        print(f"SUCCESS: User '{email}' plan changed from '{old_plan}' to '{plan}'.")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(set_plan(email, plan))
