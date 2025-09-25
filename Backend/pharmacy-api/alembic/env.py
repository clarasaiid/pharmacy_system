import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncEngine
from alembic import context
import os
import sys

# Add your project directory to sys.path so Alembic can find your modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import your async engine and Base
from app.database import async_engine, Base

# Import all model modules so Alembic can detect them
from app.models import (
    user,
    patient,
    medication,
    medication_request,
    medication_dispenses,
    organization,
    prescription,
    purchase,
    sale,
    inventory,
    audit_log,
)

# Alembic Config
config = context.config

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for 'autogenerate'
target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = str(async_engine.url)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    """Run migrations in 'online' mode."""
    async with async_engine.begin() as conn:
        await conn.run_sync(do_run_migrations)

    await async_engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
