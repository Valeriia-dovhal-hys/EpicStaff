import os

USER_ID = "onlyone"
SESSION_ID = "111"


PGVECTOR_MEMORY_CONFIG = {
    "provider": "local_mem0",
    "config": {"user_id": USER_ID, "run_id": SESSION_ID},
    "db_config": {
        "vector_store": {
            "provider": "pgvector",
            "config": {
                "user": os.environ.get("DB_USER", "postgres"),
                "password": os.environ.get("DB_PASSWORD", "admin"),
                "port": os.environ.get("DB_PORT", "5432"),
                "collection_name": "tables_memorydatabase",
                "host": os.environ.get("DB_HOST_NAME", None),
                "dbname": "crew",
            },
        },
    },
}
