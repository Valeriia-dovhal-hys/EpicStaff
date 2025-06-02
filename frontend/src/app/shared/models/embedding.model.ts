export interface EmbeddingModel {
  id: number;
  name: string;
  deployment?: string;
  base_url?: string;
  embedding_provider?: number;
}
