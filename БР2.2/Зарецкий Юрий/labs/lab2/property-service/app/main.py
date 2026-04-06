from fastapi import Response
from prometheus_client import make_asgi_app

from app.container import Container
from app.handlers.cities import router as cities_router
from app.handlers.comforts import router as comforts_router
from app.handlers.deals import router as deals_router
from app.handlers.internal import router as internal_router
from app.handlers.photos import router as photos_router
from app.handlers.properties import router as properties_router
from app.handlers.users import router as users_router

container = Container()

app = container.app()

app.include_router(cities_router)
app.include_router(comforts_router)
app.include_router(properties_router)
app.include_router(photos_router)
app.include_router(deals_router)
app.include_router(users_router)
app.include_router(internal_router)

app.mount(path="/metrics", app=make_asgi_app())


@app.get(path="/health", tags=["Health"])
async def health_check() -> Response:
    return Response()
