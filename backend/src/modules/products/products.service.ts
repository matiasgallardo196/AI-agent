import { Injectable } from '@nestjs/common';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async getAllProducts() {
    return this.productsRepository.findAll();
  }

  async getProductById(id: number) {
    return this.productsRepository.findById(id);
  }
}
