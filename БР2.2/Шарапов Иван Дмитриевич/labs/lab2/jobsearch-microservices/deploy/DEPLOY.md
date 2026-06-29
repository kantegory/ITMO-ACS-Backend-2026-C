# ЛР4 + ДЗ6. Развёртывание на удалённом сервере и CI/CD

## 1. Подготовка сервера (Ubuntu 22.04)

```bash
# обновление и базовые пакеты
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx

# Docker + docker compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # перелогиниться после этого
```

## 2. Развёртывание приложения

```bash
git clone https://github.com/<you>/<repo>.git
cd <repo>/jobsearch-microservices   # путь до docker-compose.yml
docker compose up -d --build
```

Проверка: `curl http://localhost:3000/health` должен вернуть `{"status":"ok"}`.

## 3. Nginx как обратный прокси

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/jobsearch
sudo ln -s /etc/nginx/sites-available/jobsearch /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Теперь API доступен извне по `http://<домен-или-IP>/api/...`.
(Опционально — HTTPS через `certbot --nginx`.)

## 4. CI/CD — автодеплой (GitHub Actions)

Workflow `.github/workflows/deploy.yml` срабатывает на push в ветку `main`,
подключается к серверу по SSH и пересобирает контейнеры.

Добавьте секреты в **Settings → Secrets and variables → Actions**:

| Секрет            | Значение                                  |
| ----------------- | ----------------------------------------- |
| `SSH_HOST`        | IP или домен сервера                       |
| `SSH_USER`        | пользователь (напр. `deploy` или `ubuntu`) |
| `SSH_PORT`        | порт SSH (обычно `22`)                     |
| `SSH_PRIVATE_KEY` | приватный ключ для доступа на сервер        |
| `DEPLOY_PATH`     | путь до репозитория на сервере             |

Генерация ключа и добавление публичной части на сервер:

```bash
ssh-keygen -t ed25519 -C "github-actions"
ssh-copy-id -i ключ.pub <user>@<host>
# приватную часть (содержимое файла без .pub) -> в секрет SSH_PRIVATE_KEY
```

После настройки любой push в `main` автоматически выкатывает приложение.
