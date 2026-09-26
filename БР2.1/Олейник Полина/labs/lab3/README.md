# Docker-развёртывание — справка

## Порты

| Сервис | Порт внутри сети | Снаружи (с компьютера) | Адрес |
|---|---|---|---|
| gateway | 8080 | да | `http://localhost:8080` |
| auth | 3001 | нет | только внутри сети, `http://auth:3001` |
| restaurants | 3002 | нет | только внутри сети, `http://restaurants:3002` |
| bookings | 3003 | нет | только внутри сети, `http://bookings:3003` |
| db (Postgres) | 5432 | да | `localhost:15433` (psql/pgAdmin) |
| rabbitmq (AMQP) | 5672 | да | `localhost:5673` |
| rabbitmq (Management UI) | 15672 | да | `localhost:15673`, логин/пароль — из `.env` |

## Команды

Все — в PowerShell, из корня `лр 3`.

### Запуск

```powershell
docker compose up -d --build
```
Первый запуск или после правок в коде/Dockerfile — пересобрать образы и поднять всё.

```powershell
docker compose up -d
```
Обычный повторный запуск, без пересборки.

```powershell
docker compose up -d --build auth
```
Пересобрать и перезапустить только один сервис (вместо `auth` — любой другой).

### Проверка состояния

```powershell
docker compose ps
```
Статус контейнеров. У `db`/`rabbitmq` должно быть `Up (healthy)`, у остальных — `Up`.

```powershell
docker compose logs auth restaurants bookings gateway --tail 20
```
Последние логи всех Node-сервисов разом.

```powershell
docker compose logs db
```
Логи конкретного контейнера — если что-то не поднялось, начинать отсюда.

### Тестовые данные

```powershell
docker compose run --rm -v "${PWD}/scripts:/app/scripts" -e AUTH_SERVICE_URL=http://auth:3001 auth node scripts/seed.js
```
Завести сидовых `admin`/`owner`. Отдельным одноразовым контейнером — напрямую с компьютера не сработает, `gateway` блокирует `/internal/*`, куда стучится скрипт.

### Проверка снаружи

```powershell
$body = @{ email = "check@example.com"; password = "Password123!"; first_name = "Check"; last_name = "User"; phone = "+79990000000" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/v1/auth/register" -Method Post -Body $body -ContentType "application/json"
```
Регистрация через gateway — сквозная проверка до самой базы. Ожидается `201` с `access_token`.

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/v1/cities"
```
Проверка `restaurants` через gateway.

> `127.0.0.1`, а не `localhost` — на части Windows-хостов `Invoke-RestMethod`
> резолвит `localhost` в `::1`, и проброс порта может не ответить. `curl.exe`
> с `localhost` работает в любом случае.

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:3001" -TimeoutSec 3
```
Должна упасть с ошибкой соединения — `auth` не пробрасывается наружу.

```powershell
docker compose exec gateway wget -qO- http://restaurants:3002/api/v1/cities
```
Проверка сети изнутри — обращение по имени сервиса, как это делают сами контейнеры.

### Остановка

```powershell
docker compose stop
```
Выключить контейнеры, оставить на месте.

```powershell
docker compose down
```
Выключить и удалить контейнеры. Данные Postgres (`./dbs/postgres-data`, папка на диске) не трогаются в обоих случаях.
