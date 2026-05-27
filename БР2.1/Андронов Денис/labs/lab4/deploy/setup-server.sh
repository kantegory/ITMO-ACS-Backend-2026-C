#!/usr/bin/env bash
# Initial server setup for Restorator deployment (Ubuntu 22.04/24.04).
# Run as root: sudo bash setup-server.sh

set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run this script as root (sudo bash setup-server.sh)"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Updating package index..."
apt-get update

echo "==> Installing base packages..."
apt-get install -y ca-certificates curl git nginx ufw

echo "==> Installing Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

source /etc/os-release
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Enabling services..."
systemctl enable --now docker
systemctl enable --now nginx

echo "==> Configuring firewall..."
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable

echo "==> Creating application directory..."
mkdir -p /opt/restorator
chown -R "${SUDO_USER:-root}:${SUDO_USER:-root}" /opt/restorator

echo
echo "Server setup complete."
echo "Next steps:"
echo "  1. Copy or clone the project into /opt/restorator"
echo "  2. Run deploy/deploy.sh"
echo "  3. Install nginx config from deploy/nginx/restorator.conf"
