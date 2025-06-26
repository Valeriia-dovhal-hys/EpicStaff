docker volume create crew_config
docker volume create crew_pgdata
docker compose -f ./../docker-compose.yaml up frontend 
pause
