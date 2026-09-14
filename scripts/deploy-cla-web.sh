#!/bin/bash
# Deploy cla-web lên VPS. Chạy trên VPS (14.225.212.158), không chạy local.
# usage: ./deploy-cla-web.sh [tag|branch]
#
# CI/CD gọi script này tự động: GitHub Actions `Deploy` workflow SSH vào VPS bằng
# deploy key đã gắn forced-command trỏ tới script này (xem .github/workflows/deploy.yml).
#
# Build bằng Docker (kernel glibc 2.28 của host không chạy được binding native của Turbopack;
# container node:22-bookworm-slim có glibc mới → next build --turbopack ok trong container).
set -e
REF="${1:-master}"
cd /var/www/cla-web
git fetch --force origin '+refs/heads/*:refs/remotes/origin/*' '+refs/tags/*:refs/tags/*'
# Branch: reset local branch theo origin (trước đây `git checkout -f master` dùng local cũ → deploy nhầm code cũ).
if git show-ref --verify --quiet "refs/remotes/origin/$REF"; then
  git checkout -f -B "$REF" "origin/$REF"
else
  git checkout -f "$REF"
fi
git --no-pager log --oneline -1
docker build -t cla-web:latest /var/www/cla-web
systemctl stop cla-web 2>/dev/null || true
docker rm -f cla-web 2>/dev/null || true
docker run -d --name cla-web --restart unless-stopped -p 127.0.0.1:3020:3020 -e NODE_ENV=production cla-web:latest
systemctl disable cla-web 2>/dev/null || true
docker ps --filter name=cla-web
# Dọn image cũ (dangling sau khi retag latest) + build cache — tránh đầy đĩa qua nhiều lần deploy.
docker image prune -f >/dev/null 2>&1 || true
docker builder prune -f >/dev/null 2>&1 || true
df -h / | tail -1
