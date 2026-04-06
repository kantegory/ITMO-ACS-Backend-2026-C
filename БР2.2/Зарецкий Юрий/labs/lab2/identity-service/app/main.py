from fastapi import Response
from prometheus_client import make_asgi_app

from app.container import Container
from app.handlers.auth import router as auth_router
from app.handlers.internal import router as internal_router
from app.handlers.users import router as users_router

container = Container()

app = container.app()

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(internal_router)

app.mount(path="/metrics", app=make_asgi_app())


@app.get(path="/health", tags=["Health"], summary="Проверка работоспособности сервиса")
async def health_check() -> Response:
    return Response()
