#!/bin/bash
# Deploy cla-web: usage: ./deploy-cla-web.sh [tag|branch]
# Build bằng Docker (kernel glibc 2.28 của host không chạy được binding native của Turbopack;
# container node:22-bookworm-slim có glibc mới → next build --turbopack ok trong container).
set -e
REF="${1:-master}"
cd /var/www/cla-web
git fetch --tags --force origin
git checkout -f "$REF"
docker build -t cla-web:latest /var/www/cla-web
systemctl stop cla-web 2>/dev/null || true
docker rm -f cla-web 2>/dev/null || true
docker run -d --name cla-web --restart unless-stopped -p 127.0.0.1:3020:3020 -e NODE_ENV=production cla-web:latest
systemctl disable cla-web 2>/dev/null || true
docker ps --filter name=cla-web
