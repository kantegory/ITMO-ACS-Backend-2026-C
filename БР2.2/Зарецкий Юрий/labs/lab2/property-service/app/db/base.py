from contextlib import asynccontextmanager
from typing import AsyncIterator

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker


class BaseRepo:
    def __init__(self, engine: AsyncEngine) -> None:
        self.engine = engine

    @asynccontextmanager
    async def _session(self) -> AsyncIterator[AsyncSession]:
        session = async_sessionmaker(bind=self.engine, expire_on_commit=False)()
        try:
            yield session
        except SQLAlchemyError:
            await session.rollback()
            raise
        else:
            await session.commit()
        finally:
            await session.close()
