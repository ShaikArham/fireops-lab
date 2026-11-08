import os
from collections.abc import Generator
from functools import lru_cache

from fastapi import HTTPException, Request
from sqlalchemy import create_engine, func, select, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool


@lru_cache(maxsize=2)
def _session_factory(database_url: str) -> sessionmaker[Session]:
    options = (
        {"poolclass": NullPool}
        if database_url.startswith("sqlite")
        else {"pool_size": 3, "max_overflow": 2, "pool_timeout": 10, "pool_recycle": 300}
    )
    engine = create_engine(database_url, pool_pre_ping=True, **options)
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def database_engine() -> Engine:
    url = os.getenv("DATABASE_URL", "")
    if not url:
        raise HTTPException(503, "The demo database is not configured.")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return _session_factory(url).kw["bind"]


def get_session(request: Request) -> Generator[Session, None, None]:
    engine = database_engine()
    schema = getattr(request.state, "demo_schema", None)
    if os.getenv("FIREOPS_ISOLATED_DEMO", "false").lower() == "true" and not schema:
        raise HTTPException(401, "Start your demo workspace first.")
    if schema:
        with engine.begin() as conn:
            conn.execute(text("SET LOCAL statement_timeout = '20s'"))
            conn.execute(text("SET LOCAL lock_timeout = '5s'"))
            conn.execute(
                text("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))"), {"key": schema}
            )
            scoped = conn.execution_options(schema_translate_map={None: schema})
            with Session(
                scoped,
                autoflush=False,
                expire_on_commit=False,
                join_transaction_mode="create_savepoint",
            ) as session:
                session.info["isolated_demo"] = True
                if request.method == "POST" and not request.url.path.endswith("/demo/reset"):
                    from app.db.base import Base

                    rows = sum(
                        session.scalar(select(func.count()).select_from(table)) or 0
                        for table in Base.metadata.sorted_tables
                    )
                    if rows >= 50000:
                        raise HTTPException(429, "Workspace record limit reached. Reset your demo.")

                yield session
                session.commit()
    else:
        with Session(engine, autoflush=False, expire_on_commit=False) as session:
            yield session
