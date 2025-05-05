@echo off
:: Get the current absolute path
set "CURRENT_PATH=%cd%"
:: Replace '\' with '/' to match POSIX-style path
set "target_path=%CURRENT_PATH:\=/%/savefiles"

:: Create the savefiles directory if it doesn't exist
if not exist "savefiles" (
    mkdir "savefiles"
)

:: Only create and write to .env if it doesn't already exist
if not exist "..\.env" (
    echo CREW_SAVEFILES_PATH="%target_path%" > "..\.env"
    echo .env created with path: %target_path%
) else (
    echo .env already exists. No changes made.
)

docker volume create crew_config
docker volume create crew_pgdata
docker volume create sandbox_venvs
docker volume create sandbox_executions

for /f "tokens=*" %%i in ('docker ps -a -q') do (
    docker stop %%i
    docker rm %%i
)
docker compose -f ./../docker-compose.yaml up
pause
