import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { openaiConfig } from '../../config/openai.config';
import { OPENAI_API_KEY } from 'src/config/env.loader';

@Injectable()
export class OpenAiService {
  private readonly apiKey = OPENAI_API_KEY;
  private readonly client: OpenAI;
  private embeddingCache = new Map<string, number[]>();

  constructor() {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY no definido');
    }
    this.client = new OpenAI({
      apiKey: this.apiKey,
      timeout: openaiConfig.timeoutMs,
      maxRetries: openaiConfig.maxRetries,
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const cached = this.embeddingCache.get(text);
    if (cached) {
      return cached;
    }
    const res = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    const embedding = res.data[0].embedding;
    this.embeddingCache.set(text, embedding);
    return embedding;
  }
}
