from fastapi import Response
from prometheus_client import make_asgi_app

from app.container import Container

container = Container()

app = container.app()

app.mount(path="/metrics", app=make_asgi_app())


@app.get(path="/health", tags=["Health"])
async def health_check() -> Response:
    return Response()
