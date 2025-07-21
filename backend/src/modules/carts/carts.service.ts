import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CartsRepository } from './carts.repository';

@Injectable()
export class CartsService {
  constructor(private readonly cartsRepository: CartsRepository) {}

  private async validateProductsAndStock(items: { product_id: number; qty: number }[]) {
    const productIds = items.map((i) => i.product_id);
    const products = await this.cartsRepository.findProductsByIds(productIds);

    const existingIds = new Set(products.map((p) => p.id));
    const notFound = productIds.filter((id) => !existingIds.has(id));
    if (notFound.length > 0) {
      throw new NotFoundException(`Productos no encontrados: ${notFound.join(', ')}`);
    }

    const errors = items.reduce<
      {
        productId: number;
        name: string;
        stockDisponible: number;
        cantidadSolicitada: number;
      }[]
    >((acc, item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (product && product.stock < item.qty) {
        acc.push({
          productId: product.id,
          name: product.name,
          stockDisponible: product.stock,
          cantidadSolicitada: item.qty,
        });
      }
      return acc;
    }, []);

    return { products, errors };
  }

  async createCart(items: { product_id: number; qty: number }[]) {
    if (items.length === 0) {
      throw new BadRequestException('No se puede crear un carrito sin ítems');
    }

    const { errors } = await this.validateProductsAndStock(items);
    if (errors.length > 0) {
      return { errors };
    }
    const cart = await this.cartsRepository.createCart(items);
    await this.cartsRepository.decrementStock(items);
    return cart;
  }

  async updateCartItems(cartId: number, items: { product_id: number; qty: number }[]) {
    console.log('Updating cart items for cartId:', cartId, 'with items:', items);
    if (items.length === 0) {
      throw new BadRequestException('No se puede actualizar con una lista vacía');
    }

    const { errors } = await this.validateProductsAndStock(items);
    if (errors.length > 0) {
      return { errors };
    }
    const cart = await this.cartsRepository.updateCartItemsTransactional(cartId, items);
    await this.cartsRepository.decrementStock(items);
    return cart;
  }

  async findById(id: number) {
    return this.cartsRepository.findById(id);
  }

  async getItemsWithProductInfo(cartId: number) {
    return this.cartsRepository.getItemsWithProductInfo(cartId);
  }
}
