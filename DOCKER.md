# Docker Setup Guide

This guide explains how to run TABLA BAKI using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Services

### Backend (FastAPI)
- **Port**: 8000
- **Image**: Python 3.11-slim
- **Health Check**: Checks `/docs` endpoint

### Frontend (React + Nginx)
- **Port**: 3000 (mapped to container port 80)
- **Image**: Multi-stage build (Node.js builder + Nginx)
- **Health Check**: Checks root endpoint

## Commands

### Start services
```bash
docker-compose up
```

### Start in background
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend

# Follow logs
docker-compose logs -f
```

### Rebuild after code changes
```bash
docker-compose up --build
```

### Execute commands in containers
```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh
```

## Development Mode

For development with hot-reload, you can mount volumes:

```yaml
# Already configured in docker-compose.yml
volumes:
  - ./api:/app
```

Changes to Python files will be reflected immediately (if using `--reload` flag).

## Production Build

For production, you may want to:

1. Remove volume mounts
2. Set `NODE_ENV=production`
3. Use production-optimized builds
4. Configure proper CORS origins
5. Set up SSL/TLS

Example production `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./api
      dockerfile: Dockerfile
    environment:
      - PYTHONUNBUFFERED=1
      - CORS_ORIGINS=https://yourdomain.com
    restart: always

  frontend:
    build:
      context: ./app
      dockerfile: Dockerfile
    depends_on:
      - backend
    restart: always
```

## Troubleshooting

### Port already in use
If ports 3000 or 8000 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "3001:80"  # Change host port
```

### CORS errors
Update `CORS_ORIGINS` environment variable in `docker-compose.yml`:
```yaml
environment:
  - CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Frontend can't reach backend
Ensure the frontend container can resolve the `backend` hostname. Check:
```bash
docker-compose exec frontend ping backend
```

### Rebuild specific service
```bash
docker-compose build backend
docker-compose up -d backend
```

## Environment Variables

### Backend
- `PYTHONUNBUFFERED=1` - Ensures Python output is not buffered
- `CORS_ORIGINS` - Comma-separated list of allowed origins

### Frontend
- `VITE_API_URL` - Backend API URL (defaults to `/api` in production)

## Volumes

The current setup mounts the `api` directory for development. For production, remove volume mounts to use the built image.
