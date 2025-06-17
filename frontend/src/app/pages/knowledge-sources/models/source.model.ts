import { ChunkStrategy } from './source-collection.model';

export interface Source {
  document_id: number;
  file_name: string;
  file_type: string; // e.g. "html", "pdf", etc.
  source_collection: number;
  chunk_size: number;
  chunk_strategy: ChunkStrategy;
  chunk_overlap: number;
}
