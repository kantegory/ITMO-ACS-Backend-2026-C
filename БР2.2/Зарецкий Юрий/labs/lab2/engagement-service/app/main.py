from fastapi import Response
from prometheus_client import make_asgi_app

from app.container import Container
from app.handlers.conversations import router as conversations_router
from app.handlers.messages import router as messages_router
from app.handlers.reviews import router as reviews_router

container = Container()

app = container.app()

app.include_router(conversations_router)
app.include_router(messages_router)
app.include_router(reviews_router)

app.mount(path="/metrics", app=make_asgi_app())


@app.get(path="/health", tags=["Health"])
async def health_check() -> Response:
    return Response()
