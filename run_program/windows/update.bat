set /p REGISTRY_DIR=<../image_registry.txt
set /p IMAGE_TAG=<../image_tag.txt

for /f "tokens=*" %%i in ('docker ps -a -q') do (
    docker stop %%i
    docker rm %%i
)

docker pull %REGISTRY_DIR%/django_app:%IMAGE_TAG%
docker pull %REGISTRY_DIR%/manager:%IMAGE_TAG%
docker pull %REGISTRY_DIR%/crew:%IMAGE_TAG%
docker pull %REGISTRY_DIR%/frontend:%IMAGE_TAG%
docker pull %REGISTRY_DIR%/sandbox:%IMAGE_TAG%
docker pull %REGISTRY_DIR%/knowledge:%IMAGE_TAG%
docker pull %REGISTRY_DIR%/realtime:%IMAGE_TAG%

docker tag %REGISTRY_DIR%/django_app:%IMAGE_TAG% django_app
docker tag %REGISTRY_DIR%/manager:%IMAGE_TAG% manager
docker tag %REGISTRY_DIR%/crew:%IMAGE_TAG% crew
docker tag %REGISTRY_DIR%/frontend:%IMAGE_TAG% frontend
docker tag %REGISTRY_DIR%/sandbox:%IMAGE_TAG% sandbox
docker tag %REGISTRY_DIR%/knowledge:%IMAGE_TAG% knowledge
docker tag %REGISTRY_DIR%/realtime:%IMAGE_TAG% realtime


pause