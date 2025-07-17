import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}
  async getAllProducts() {
    return this.prisma.product.findMany();
  }

  async getProductById(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }
}
