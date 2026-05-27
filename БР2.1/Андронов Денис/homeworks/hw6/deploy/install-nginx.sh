#!/usr/bin/env bash
# Install nginx site config and reload nginx.
# Usage: sudo bash deploy/install-nginx.sh YOUR_SERVER_IP_OR_DOMAIN

set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run this script as root (sudo bash deploy/install-nginx.sh <server_name>)"
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: sudo bash deploy/install-nginx.sh <server_ip_or_domain>"
  exit 1
fi

SERVER_NAME="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_SRC="${SCRIPT_DIR}/nginx/restorator.conf"
CONF_DST="/etc/nginx/sites-available/restorator"

sed "s/SERVER_NAME/${SERVER_NAME}/g" "${CONF_SRC}" > "${CONF_DST}"
ln -sf "${CONF_DST}" /etc/nginx/sites-enabled/restorator
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo "Nginx configured for server_name=${SERVER_NAME}"
echo "Check: curl http://${SERVER_NAME}/health"
