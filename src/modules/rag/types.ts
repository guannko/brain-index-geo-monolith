// Document Input for ingestion
export interface DocumentInput {
  url: string;
  content: string;
  metadata: {
    title: string;
    contentType: 'article' | 'product' | 'service' | 'about';
    author?: string;
    publishedDate?: string;
  };
}

// Chunked document result
export interface ChunkedDocument {
  chunks: DocumentChunk[];
  totalChunks: number;
  processingTime: number;
}

// Single document chunk
export interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: ChunkMetadata;
}

// Chunk metadata
export interface ChunkMetadata {
  documentId: string;
  chunkIndex: number;
  tokenCount: number;
  url: string;
  title: string;
  semanticType: 'heading' | 'paragraph' | 'list' | 'quote';
  contentType?: string;
}

// Retrieval query
export interface RetrievalQuery {
  query: string;
  topK: number;
  filters?: RetrievalFilters;
  minSimilarity?: number;
}

// Retrieval filters
export interface RetrievalFilters {
  documentIds?: string[];
  contentTypes?: string[];
  dateRange?: { from: Date; to: Date };
}

// Retrieval result
export interface RetrievalResult {
  chunks: RetrievedChunk[];
  queryTime: number;
}

// Retrieved chunk with similarity
export interface RetrievedChunk {
  chunkId: string;
  content: string;
  similarity: number;
  metadata: ChunkMetadata;
  highlight?: string;
}

// Context assembly request
export interface ContextRequest {
  query: string;
  maxTokens: number;
  retrievalConfig: RetrievalQuery;
}

// Assembled context
export interface AssembledContext {
  context: string;
  sources: SourceReference[];
  tokenCount: number;
}

// Source reference
export interface SourceReference {
  chunkId: string;
  url: string;
  title: string;
  excerpt: string;
}
