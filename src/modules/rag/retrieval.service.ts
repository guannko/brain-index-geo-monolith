import { QdrantClient } from '@qdrant/js-client-rest';
import { OpenAIEmbeddings } from '@langchain/openai';
import config from '../../config/env.config.js';
import logger from '../../config/logger.js';
import type { RetrievalQuery, RetrievalResult, RetrievedChunk } from './types.js';

export class RAGRetrievalService {
  private collectionName = 'rag_collection';
  private qdrant: QdrantClient;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.qdrant = new QdrantClient({ url: config.QDRANT_URL, apiKey: config.QDRANT_API_KEY });
    this.embeddings = new OpenAIEmbeddings({ openAIApiKey: config.OPENAI_API_KEY, modelName: 'text-embedding-3-small' });
  }

  async retrieve(query: RetrievalQuery): Promise<RetrievalResult> {
    const startTime = Date.now();
    const queryEmbedding = await this.embeddings.embedQuery(query.query);
    const searchResult = await this.qdrant.search(this.collectionName, {
      vector: queryEmbedding,
      limit: query.topK || 5,
      score_threshold: query.minSimilarity || 0.7,
      with_payload: true,
    });

    const chunks: RetrievedChunk[] = searchResult.map(p => ({
      chunkId: p.id as string,
      content: p.payload?.content as string || '',
      similarity: p.score || 0,
      metadata: {
        documentId: p.payload?.documentId as string,
        chunkIndex: p.payload?.chunkIndex as number,
        tokenCount: p.payload?.tokenCount as number || 0,
        url: p.payload?.url as string,
        title: p.payload?.title as string,
        semanticType: 'paragraph' as any,
      },
      highlight: (p.payload?.content as string || '').substring(0, 200),
    }));

    logger.info('Retrieval done', { query: query.query, results: chunks.length });
    return { chunks, queryTime: Date.now() - startTime };
  }
}
