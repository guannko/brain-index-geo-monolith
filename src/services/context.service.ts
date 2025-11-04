import { QdrantClient } from '@qdrant/js-client-rest';
import { openai } from '../shared/openai.js';
import { env } from '../config/env.js';

interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

export class ContextService {
  private client: QdrantClient;
  private collectionName = 'brain-index-documents';

  constructor() {
    this.client = new QdrantClient({
      url: env.QDRANT_URL || 'http://localhost:6333',
      apiKey: env.QDRANT_API_KEY,
    });
  }

  /**
   * Initialize Qdrant collection
   */
  async initialize(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName
      );

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 1536, // OpenAI ada-002 embedding size
            distance: 'Cosine',
          },
        });
        console.log(`✅ Qdrant collection "${this.collectionName}" created`);
      } else {
        console.log(`✅ Qdrant collection "${this.collectionName}" exists`);
      }
    } catch (error) {
      console.error('❌ Qdrant initialization failed:', error);
      throw error;
    }
  }

  /**
   * Ingest documents into Qdrant
   */
  async ingestDocuments(documents: Document[]): Promise<void> {
    try {
      const points = await Promise.all(
        documents.map(async (doc, index) => {
          // Generate embedding using OpenAI
          const embedding = await this.generateEmbedding(doc.content);

          return {
            id: doc.id || `doc-${index}`,
            vector: embedding,
            payload: {
              content: doc.content,
              ...doc.metadata,
            },
          };
        })
      );

      await this.client.upsert(this.collectionName, {
        wait: true,
        points,
      });

      console.log(`✅ Ingested ${documents.length} documents into Qdrant`);
    } catch (error) {
      console.error('❌ Document ingestion failed:', error);
      throw error;
    }
  }

  /**
   * Search for relevant documents using vector similarity
   */
  async search(query: string, limit = 5): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);

      const results = await this.client.search(this.collectionName, {
        vector: queryEmbedding,
        limit,
        with_payload: true,
      });

      return results.map((result) => ({
        id: result.id as string,
        content: result.payload?.content as string,
        score: result.score,
        metadata: result.payload as Record<string, any>,
      }));
    } catch (error) {
      console.error('❌ Search failed:', error);
      throw error;
    }
  }

  /**
   * Generate context for a given query
   */
  async generateContext(query: string, maxResults = 3): Promise<string> {
    const results = await this.search(query, maxResults);

    if (results.length === 0) {
      return 'No relevant context found.';
    }

    const context = results
      .map((result, index) => {
        return `[Source ${index + 1}] (Score: ${result.score.toFixed(2)})
${result.content}`;
      })
      .join('\n\n');

    return context;
  }

  /**
   * Generate embedding using OpenAI ada-002
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  }

  /**
   * Delete all documents from collection
   */
  async clearCollection(): Promise<void> {
    try {
      await this.client.deleteCollection(this.collectionName);
      await this.initialize();
      console.log(`✅ Collection "${this.collectionName}" cleared`);
    } catch (error) {
      console.error('❌ Clear collection failed:', error);
      throw error;
    }
  }
}

// Singleton instance
export const contextService = new ContextService();
