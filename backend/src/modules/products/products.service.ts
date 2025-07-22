import { Injectable } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { OpenAiService } from '../openai/openai.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Product } from '@prisma/client';

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

  async searchProductsSemantic(query: string): Promise<Product[]> {
    const queryEmbedding = await this.openaiService.generateEmbedding(query);

    const vectorParam = Prisma.sql`${queryEmbedding}::vector`;
    const result = await this.prisma.$queryRaw<Product[]>(Prisma.sql`
          SELECT id, name, description, price, stock
          FROM products
          ORDER BY embedding <#> ${vectorParam}
          LIMIT 5
        `);
    return result;
  }
}
