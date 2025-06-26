set REGISTRY_DIR=registry.gitlab.hysdev.com/sheetsui/crewai-sheetsui
set /p IMAGE_TAG=<../image_tag.txt

docker pull %REGISTRY_DIR%/frontend:%IMAGE_TAG%

docker tag %REGISTRY_DIR%/frontend:%IMAGE_TAG% frontend

pause