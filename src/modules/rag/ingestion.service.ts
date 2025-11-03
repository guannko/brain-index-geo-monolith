import { QdrantClient } from '@qdrant/js-client-rest';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import * as cheerio from 'cheerio';
import Redis from 'ioredis';
import config from '../../config/env.config.js';
import logger from '../../config/logger.js';
import type { DocumentInput, ChunkMetadata } from './types.js';

export class RAGIngestionService {
  private collectionName = 'rag_collection';
  private qdrant: QdrantClient;
  private embeddings: OpenAIEmbeddings;
  private pool: Pool | null = null;
  private redis: Redis | null = null;

  constructor() {
    this.qdrant = new QdrantClient({ url: config.QDRANT_URL, apiKey: config.QDRANT_API_KEY });
    this.embeddings = new OpenAIEmbeddings({ openAIApiKey: config.OPENAI_API_KEY, modelName: 'text-embedding-3-small' });
    if (config.DATABASE_URL) this.pool = new Pool({ connectionString: config.DATABASE_URL });
    try { this.redis = new Redis(config.REDIS_URL); } catch (e) { logger.warn('Redis disabled'); }
    this.ensureCollectionExists();
  }

  async ensureCollectionExists(): Promise<void> {
    try {
      const collections = await this.qdrant.getCollections();
      const exists = collections.collections?.some(c => c.name === this.collectionName);
      if (!exists) {
        await this.qdrant.createCollection(this.collectionName, { vectors: { size: 1536, distance: 'Cosine' } });
        logger.info(`Created Qdrant collection: ${this.collectionName}`);
      }
    } catch (error) { logger.error('Qdrant collection creation failed', { error }); throw error; }
  }

  async ingestDocument(input: DocumentInput): Promise<{ documentId: string; chunksCreated: number }> {
    const startTime = Date.now();
    if (!['article', 'product', 'service', 'about'].includes(input.metadata.contentType)) throw new Error('Invalid contentType');

    const $ = cheerio.load(input.content);
    $('nav, footer, .ad, script, style, iframe').remove();
    const cleanContent = $.text().replace(/\s+/g, ' ').trim();
    if (cleanContent.length < 50) throw new Error('Content too short');

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 800, chunkOverlap: 100 });
    const chunks = await splitter.splitText(cleanContent);
    const documentId = uuidv4();

    const chunkData = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = uuidv4();
      const embedding = await this.getOrComputeEmbedding(chunks[i]);
      chunkData.push({ id: chunkId, vector: embedding, payload: { documentId, chunkIndex: i, url: input.url, title: input.metadata.title, contentType: input.metadata.contentType, content: chunks[i] } });
    }

    await this.qdrant.upsert(this.collectionName, { points: chunkData });
    logger.info('Document ingested', { documentId, chunks: chunks.length, time: Date.now() - startTime });
    return { documentId, chunksCreated: chunks.length };
  }

  async ingestBulk(documents: DocumentInput[]) {
    const results = await Promise.allSettled(documents.map(d => this.ingestDocument(d)));
    const processed = results.filter(r => r.status === 'fulfilled').length;
    const errors = results.filter(r => r.status === 'rejected').map((r, i) => ({ document: documents[i].url, error: (r as any).reason.toString() }));
    return { processed, failed: documents.length - processed, errors };
  }

  private async getOrComputeEmbedding(text: string): Promise<number[]> {
    if (!this.redis) return await this.embeddings.embedQuery(text);
    const key = `emb:${Buffer.from(text.substring(0, 50)).toString('base64')}`;
    try { const cached = await this.redis.get(key); if (cached) return JSON.parse(cached); } catch (e) {}
    const emb = await this.embeddings.embedQuery(text);
    try { await this.redis.set(key, JSON.stringify(emb), 'EX', 86400); } catch (e) {}
    return emb;
  }

  async close() { if (this.pool) await this.pool.end(); if (this.redis) this.redis.disconnect(); }
}