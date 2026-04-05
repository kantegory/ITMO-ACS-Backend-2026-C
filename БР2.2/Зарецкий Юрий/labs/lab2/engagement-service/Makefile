TARGET_DIRS := app

lint:
	@uv run ruff check $(TARGET_DIRS)
	@uv run mypy --strict $(TARGET_DIRS)

format:
	@uv run ruff check --fix $(TARGET_DIRS)

run:
	@uv run uvicorn --host 0.0.0.0 --port 8000 --reload --no-access-log --log-config uvicornlogs.json app.main:app

migrate:
	@uv run alembic upgrade head
