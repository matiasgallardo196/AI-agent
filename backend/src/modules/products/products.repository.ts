import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: string) {
    const peticion = await this.prisma.product.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
    });
    console.log('Petición a la base de datos:', peticion, query);
    return await peticion;
  }

  async findById(id: number) {
    return await this.prisma.product.findUnique({
      where: { id },
    });
  }
}
