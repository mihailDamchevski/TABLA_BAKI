#!/usr/bin/env sh
set -eu

cd ~/TABLA_BAKI
git pull
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
