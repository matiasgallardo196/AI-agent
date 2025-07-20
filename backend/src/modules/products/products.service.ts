import { Injectable } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { OpenAiService } from '../openai/openai.service';
import { PrismaService } from 'prisma/prisma.service';
import { cosineSimilarity } from 'src/utils/cosineSimilarity';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly openaiService: OpenAiService,
    private readonly prisma: PrismaService,
  ) {}

  async getAllProducts(query?: string) {
    return await this.productsRepository.findAll(query);
  }

  async getProductById(id: number) {
    return await this.productsRepository.findById(id);
  }

  async searchProductsSemantic(query: string) {
    const queryEmbedding = await this.openaiService.generateEmbedding(query);

    const products = await this.prisma.product.findMany();

    const filtered = products.filter((p) => Array.isArray(p.embedding) && p.embedding.length > 0);

    const scored = filtered
      .map((product) => ({
        ...product,
        score: cosineSimilarity(queryEmbedding, product.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const simplified = scored.map(({ embedding, ...rest }) => rest);
    //console.log('Scored products:', simplified);
    return simplified;
  }
}
