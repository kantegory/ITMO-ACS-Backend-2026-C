# HW6: CI/CD deployment

## Structure

```text
hw6/
  app/                         Application source and Docker files
    docker-compose.yml         Local compose file
    docker-compose.vps.yml     VPS compose file for deployment
    docker/                    Service Dockerfiles
    infra/                     PostgreSQL init scripts
    src/                       TypeScript source code
  deploy/
    nginx/                     Nginx config used on the VPS
  task6.md                     Homework task
```

## Deployment target

```text
Host: 84.38.180.240
Domain: bk.lab1.zelenkov-labs.ru
Server directory: /opt/zelenkov-labs/booking-microservices-hw6
Public URL: https://bk.lab1.zelenkov-labs.ru
```

The homework should deploy only the contents of `hw6/app` to the server directory.
On the server, `docker-compose.vps.yml` is used as the deployment compose file.

## Proposed CI/CD flow

Workflow file:

```text
.github/workflows/deploy-hw6.yml
```

1. Trigger GitHub Actions on push to the `hw6` branch.
2. Run a TypeScript check in `hw6/app`.
3. Copy `hw6/app` to `/opt/zelenkov-labs/booking-microservices-hw6` over SSH.
4. Run Docker Compose on the server:

```bash
cd /opt/zelenkov-labs/booking-microservices-hw6
docker-compose -f docker-compose.vps.yml config
docker-compose -f docker-compose.vps.yml build
docker-compose -f docker-compose.vps.yml up -d --remove-orphans
curl -f http://127.0.0.1:3106/health
```

5. Verify the public endpoint:

```bash
curl -f https://bk.lab1.zelenkov-labs.ru/health
```

Seed should stay manual, because running it on every deployment can duplicate or overwrite test data.

## GitHub Secrets

The repository must contain these secrets:

```text
VPS_HOST=84.38.180.240
VPS_PORT=22
VPS_USER=github-hw6
VPS_SSH_KEY=<private ssh key>
```

`VPS_PORT` can be omitted if SSH uses port `22`.

For this homework, the server has a dedicated deploy user `github-hw6`.
It owns only `/opt/zelenkov-labs/booking-microservices-hw6` and can run only
one privileged deployment command through sudo:

```bash
sudo /usr/local/sbin/deploy-hw6-compose
```
