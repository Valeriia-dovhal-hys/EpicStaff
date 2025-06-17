import { Source } from './source.model';

export type ChunkStrategy =
  | 'token'
  | 'character'
  | 'markdown'
  | 'json'
  | 'html';

export enum CollectionStatus {
  NEW = 'new',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
export interface GetSourceCollectionRequest {
  collection_id: number;
  collection_name: string;
  user_id: string;
  status: CollectionStatus;
  embedder: number;
  created_at: string;
  document_metadata: Source[];
  additional_params: {};
}

export interface CreateGetSourceCollectionRequestRequest {
  collection_name: string;
  user_id: string;
  embedder: string;
  files: File[];
  chunk_sizes: number[];
  chunk_strategies: ChunkStrategy[];
  chunk_overlaps: number[];
  additional_params: {};
}
