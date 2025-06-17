#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Run database migrations
echo "Applying database migrations..."
python manage.py migrate

# Upload models (custom command)
echo "Uploading models..."
python manage.py upload_models

# Start Redis listener in the background
echo "Starting Redis listener..."
python manage.py listen_redis &

# Start Django application
echo "Starting Django server..."
exec python manage.py runserver 0.0.0.0:8000