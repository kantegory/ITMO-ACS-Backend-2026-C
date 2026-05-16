FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

ENV UV_PROJECT_ENVIRONMENT="/usr/local/"

WORKDIR /app

COPY uv.lock pyproject.toml /app/
RUN uv sync --locked --no-install-project

COPY . /app
RUN uv sync --locked

CMD ["uvicorn", "--host", "0.0.0.0", "--port", "8000", "--no-access-log", "--log-config", "uvicornlogs.json", "app.main:app"]
