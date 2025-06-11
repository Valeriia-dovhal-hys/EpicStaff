#!/bin/sh

# Set environment variables
GITLAB_REGISTRY="registry.gitlab.hysdev.com"
PROJECT_DIR="sheetsui/crewai-sheetsui"
REGISTRY_DIR="$GITLAB_REGISTRY/$PROJECT_DIR"

# Pull Docker images
docker pull "$REGISTRY_DIR/crew"
docker pull "$REGISTRY_DIR/manager"
docker pull "$REGISTRY_DIR/django_app"
docker pull "$REGISTRY_DIR/frontend"

# Tag Docker images
docker tag "$REGISTRY_DIR/crew" crew
docker tag "$REGISTRY_DIR/manager" manager
docker tag "$REGISTRY_DIR/django_app" django_app
docker tag "$REGISTRY_DIR/frontend" frontend


# Create Docker volume
docker volume create crew_config
docker volume create crew_pgdata

# # Start services with Docker Compose
# docker compose up

# # Pause to keep the script open
# read -p "Press [Enter] key to continue..."
