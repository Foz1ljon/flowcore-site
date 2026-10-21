#!/usr/bin/env bash
# One-time root setup for the landing site on the shared FlowCore host.
#
#   scp -r deploy root@204.168.251.7:/tmp/flowcore-landing-deploy
#   ssh root@204.168.251.7 bash /tmp/flowcore-landing-deploy/server-setup.sh
#
# 1. Hands /var/www/flowcore-site to the deploy user so CI can upload files, and
#    removes development files left by a manual upload (not from a git checkout).
# 2. Replaces the static-only flowcore.uz vhost with deploy/nginx.conf, which
#    proxies POST /api/public/leads to NestJS (127.0.0.1:4000).
# 3. Adds the landing origin to backend ALLOWED_ORIGINS and reloads the backend.
# Safe to run again; the previous vhost is restored if nginx -t fails.
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR=/var/www/flowcore-site
BACKEND_DIR=/var/www/flowcore-backend
DEPLOY_USER=deploy
ORIGINS="https://flowcore.uz https://www.flowcore.uz"
STAMP="$(date +%Y%m%d%H%M%S)"

[ "$(id -u)" -eq 0 ] || { echo "Run as root." >&2; exit 1; }

echo "== Site directory"
install -d "$SITE_DIR"
# Development files from an earlier manual upload; CI uploads public files only.
# A git checkout keeps them (nginx-static.conf answers 404 for them instead).
if [ ! -d "$SITE_DIR/.git" ]; then
  (cd "$SITE_DIR" && rm -rf tools deploy node_modules README.md package.json package-lock.json _headers)
fi
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$SITE_DIR"
# Root may still run git pull in the deploy-owned checkout.
git config --system --get-all safe.directory 2>/dev/null | grep -qx "$SITE_DIR" \
  || git config --system --add safe.directory "$SITE_DIR"
chmod -R a+rX "$SITE_DIR"

echo "== nginx"
install -m 644 "$SRC/nginx-leads.conf" /etc/nginx/snippets/flowcore-leads.conf
install -m 644 "$SRC/nginx-static.conf" /etc/nginx/snippets/flowcore-static.conf
OLD=/etc/nginx/sites-enabled/flowcore.uz
BACKUP="/root/nginx-flowcore.uz.$STAMP"
if [ -e "$OLD" ] || [ -L "$OLD" ]; then cp -P "$OLD" "$BACKUP"; fi
install -m 644 "$SRC/nginx.conf" /etc/nginx/sites-available/flowcore.uz
ln -sfn /etc/nginx/sites-available/flowcore.uz "$OLD"
if ! nginx -t; then
  echo "nginx -t failed; restoring the previous flowcore.uz vhost." >&2
  rm -f "$OLD"
  [ -e "$BACKUP" ] || [ -L "$BACKUP" ] && cp -P "$BACKUP" "$OLD"
  exit 1
fi
systemctl reload nginx

echo "== Backend ALLOWED_ORIGINS"
for env in "$BACKEND_DIR/.env" "$BACKEND_DIR/shared/.env"; do
  [ -f "$env" ] || continue
  cp -p "$env" "$env.bak-$STAMP"
  current="$(grep -E '^ALLOWED_ORIGINS=' "$env" | tail -1 | cut -d= -f2- || true)"
  updated="$current"
  for origin in $ORIGINS; do
    case ",$updated," in
      *",$origin,"*) ;;
      *) updated="${updated:+$updated,}$origin" ;;
    esac
  done
  if grep -qE '^ALLOWED_ORIGINS=' "$env"; then
    sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$updated|" "$env"
  else
    echo "ALLOWED_ORIGINS=$updated" >> "$env"
  fi
  echo "$env: ALLOWED_ORIGINS=$updated"
done
sudo -iu "$DEPLOY_USER" bash -lc "cd '$BACKEND_DIR' && pm2 startOrReload ecosystem.config.cjs --update-env && pm2 save" >/dev/null

echo "== Check (expect HTTP 400 JSON, which means routing and origin work)"
sleep 5
curl -s -o /dev/null -w 'lead route via nginx: %{http_code}\n' \
  -H 'Host: flowcore.uz' -H 'Origin: https://flowcore.uz' -H 'Content-Type: application/json' \
  --data '{}' http://127.0.0.1/api/public/leads
