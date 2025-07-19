import { Injectable } from '@nestjs/common';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async getAllProducts(query?: string) {
    return await this.productsRepository.findAll(query);
  }

  async getProductById(id: number) {
    return await this.productsRepository.findById(id);
  }
}
