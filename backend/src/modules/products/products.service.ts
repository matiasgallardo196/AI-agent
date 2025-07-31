import { Injectable } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { OpenAiService } from '../openai/openai.service';
import { PrismaService } from '../../../prisma/prisma.service';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

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

    const result = await this.prisma.$queryRaw<Product[]>`
          SELECT id, name, description, price, stock
          FROM products
          ORDER BY embedding <#> ${queryEmbedding}::vector
          LIMIT 5
        `;
    return result;
  }
}
