import json
import redis
import os

redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))

redis_client = redis.Redis(host=redis_host, port=redis_port)

with open('tools_config.json', 'r') as f:
    config_data = json.load(f)

tools = {}
for item in config_data:
    tool_alias = list(item["tool_dict"].keys())[0]
    redis_client.hset('tools', tool_alias, json.dumps(item))

    
