from typing import Dict, Optional, List
from contextlib import contextmanager
from loguru import logger
import psycopg2
from psycopg2.extras import execute_values
from settings import Status


class KnowledgeStorage:
    def __init__(self, dbname, user, password, host, port):
        self.conn_params = dict(
            dbname=dbname, user=user, password=password, host=host, port=port
        )
        self.conn = None

    def connect(self):
        if self.conn is None or self.conn.closed != 0:
            self.conn = psycopg2.connect(**self.conn_params)
            self._ensure_uuid_extension()

    def close(self):
        if self.conn:
            self.conn.close()

    def _ensure_uuid_extension(self):
        try:
            with self.conn.cursor() as cur:
                cur.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
            self.conn.commit()
        except Exception:
            self.conn.rollback()
            logger.exception("Failed to ensure uuid-ossp extension")
            raise

    @contextmanager
    def transaction(self):
        try:
            with self.conn.cursor() as cur:
                yield cur
                self.conn.commit()
        except Exception:
            self.conn.rollback()
            logger.exception("Database error during transaction")
            raise

    def get_documents(self, collection_id):
        self.connect()
        query = """
            SELECT dm.document_id, dm.file_name, dc.content, dm.chunk_strategy, dm.chunk_size, dm.chunk_overlap
            FROM tables_documentmetadata dm
            JOIN tables_documentcontent dc
            ON dm.document_id = dc.document_metadata_id
            JOIN tables_sourcecollection sc
            ON dm.source_collection_id = sc.collection_id
            WHERE sc.collection_id = %s
            AND dm.status = %s;
        """
        with self.transaction() as cur:
            cur.execute(query, (collection_id, Status.NEW.value))
            return cur.fetchall()

    def save_embedding(self, chunk_text, embedding, document_id, collection_id):
        self.connect()
        query = """
        INSERT INTO tables_documentembedding (embedding_id, chunk_text, vector, created_at, document_id, collection_id)
        VALUES (uuid_generate_v4(), %s, %s, NOW(), %s, %s);
        """
        with self.transaction() as cur:
            cur.execute(query, (chunk_text, embedding, document_id, collection_id))

    def update_document_status(self, status, document_id):
        self.connect()
        if not isinstance(status, Status):
            logger.error(f"Trying to set an invalid status: {status}")
            return

        query = """
        UPDATE tables_documentmetadata
        SET status = %s
        WHERE document_id = %s;
        """
        with self.transaction() as cur:
            cur.execute(query, (status.value, document_id))

    def update_collection_status(self, status, collection_id):
        self.connect()
        if not isinstance(status, Status):
            logger.error(f"Trying to set an invalid status: {status}")
            return

        query = """
        UPDATE tables_sourcecollection
        SET status = %s
        WHERE collection_id = %s;
        """
        with self.transaction() as cur:
            cur.execute(query, (status.value, collection_id))

    def get_embedder_configuration(
        self, collection_id: int
    ) -> Dict[str, Optional[str]]:
        self.connect()
        sql_query = """
        SELECT 
            ec.api_key AS api_key,
            em.name AS model_name,
            p.name AS provider
        FROM 
            tables_sourcecollection sc
        JOIN 
            tables_embeddingconfig ec 
            ON ec.id = sc.embedder_id
        JOIN 
            tables_embeddingmodel em 
            ON em.id = ec.model_id
        JOIN 
            tables_provider p 
            ON p.id = em.embedding_provider_id
        WHERE 
            sc.collection_id = %s;
        """
        with self.transaction() as cur:
            cur.execute(sql_query, (collection_id,))
            result = cur.fetchone()

        if result is None:
            raise ValueError(
                f"No embedding model found for collection_id={collection_id}"
            )

        return {
            "api_key": result[0],
            "model_name": result[1],
            "provider": result[2],
        }

    def search(
        self,
        embedded_query: List[float],
        collection_id: int,
        limit: int = 3,
        distance_threshold: float = 0.6,
    ) -> Dict:
        """
        Search for documents in the knowledge base using vector similarity.
        """
        self.connect()
        sql_query = """
        SELECT vector <=> %s::vector AS distance, chunk_text
        FROM tables_documentembedding
        WHERE collection_id = %s
        ORDER BY distance
        LIMIT %s
        """

        with self.transaction() as cur:
            cur.execute(sql_query, (embedded_query, collection_id, limit))
            results = cur.fetchall()

        return [r[1] for r in results if float(r[0]) < distance_threshold]

    def __del__(self):
        self.close()
