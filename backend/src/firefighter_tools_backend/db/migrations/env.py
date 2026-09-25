"""Alembic environment: run migrations on the connection ``init_db`` shares.

The configuration is built in code by ``db.schema`` rather than read from an
``alembic.ini``, so the database URL always comes from the application's own
settings.
"""

from alembic import context

from firefighter_tools_backend.db.models import Base

connection = context.config.attributes["connection"]
context.configure(
    connection=connection,
    target_metadata=Base.metadata,
    # SQLite cannot alter most column properties in place; batch mode
    # recreates the table when a future revision needs to.
    render_as_batch=True,
)

with context.begin_transaction():
    context.run_migrations()
