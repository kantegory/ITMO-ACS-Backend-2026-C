COMPOSE=docker compose

.PHONY: build up down restart clean

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

restart: down up

clean:
	$(COMPOSE) down -v
