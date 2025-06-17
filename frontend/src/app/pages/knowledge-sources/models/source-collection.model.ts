export type ChunkStrategy =
  | 'token'
  | 'character'
  | 'markdown'
  | 'json'
  | 'html';

export interface SourceCollection {
  collection_id: number;
  collection_name: string;
  user_id: string;
  status: string; // e.g. "new", "in_progress", etc.
  embedder: number;
  created_at: string; // ISO date string: "2025-03-24T23:34:16.119693Z"
  document_metadata: string[];
}

export interface UploadSourceCollection {
  collection_name: string;
  user_id: string;
  embedder: string;
  files: File[];
  chunk_sizes: number[];
  chunk_strategies: ChunkStrategy[];
  chunk_overlaps: number[];
}
