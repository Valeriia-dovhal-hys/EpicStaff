#!/bin/sh

# Get the current absolute path
CURRENT_PATH=$(pwd)

# Convert path to POSIX-style (already is on Unix), then append /savefiles
TARGET_PATH="$CURRENT_PATH/savefiles"

# Create the savefiles directory if it doesn't exist
if [ ! -d "$TARGET_PATH" ]; then
  mkdir -p "$TARGET_PATH"
fi

# Only create and write to .env if it doesn't already exist
if [ ! -f "../.env" ]; then
  echo "CREW_SAVEFILES_PATH=\"$TARGET_PATH\"" > ../.env
  echo ".env created with path: $TARGET_PATH"
else
  echo ".env already exists. No changes made."
fi



# Create Docker volume
docker volume create crew_config
docker volume create crew_pgdata
docker volume create sandbox_venvs
docker volume create sandbox_executions

# Stop and remove all containers
echo "Stopping and removing all containers..."
docker ps -aq | xargs -r docker stop
docker ps -aq | xargs -r docker rm

# Start services with Docker Compose
docker compose -f ./../docker-compose.yaml up

# Pause to keep the script open
read -p "Press [Enter] key to continue..."
