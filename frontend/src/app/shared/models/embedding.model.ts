export interface EmbeddingModel {
  id: number;
  name: string;
  predefined: boolean;
  deployment?: string;
  base_url?: string; // Optional string field with a max length of 200
  embedding_provider?: number; // Optional integer field
}
