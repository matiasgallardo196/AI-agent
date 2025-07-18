import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartsRepository } from './carts.repository';

@Injectable()
export class CartsService {
  constructor(private readonly cartsRepository: CartsRepository) {}

  async createCart(items: { product_id: number; qty: number }[]) {
    const productIds = items.map((i) => i.product_id);
    const products = await this.cartsRepository.findProductsByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id, p]));

    const notFound = productIds.filter((id) => !productMap.has(id));
    if (notFound.length > 0) {
      throw new NotFoundException(
        `Productos no encontrados: ${notFound.join(', ')}`,
      );
    }

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (product && product.stock < item.qty) {
        throw new BadRequestException(
          `Stock insuficiente para el producto ${item.product_id}`,
        );
      }
    }

    return this.cartsRepository.createCartAndUpdateStock(items);
  }

  async updateCartItems(
    cartId: number,
    items: { product_id: number; qty: number }[],
  ) {
    const productIds = items.map((i) => i.product_id);
    const existingIds = new Set(
      await this.cartsRepository.findExistingProductIds(productIds),
    );

    const notFound = productIds.filter((id) => !existingIds.has(id));
    if (notFound.length > 0) {
      throw new NotFoundException(
        `Productos no encontrados: ${notFound.join(', ')}`,
      );
    }

    for (const item of items) {
      const existingCartItem = await this.cartsRepository.findCartItem(
        cartId,
        item.product_id,
      );

      if (item.qty <= 0) {
        if (existingCartItem) {
          await this.cartsRepository.deleteCartItem(existingCartItem.id);
        }
        continue;
      }

      if (existingCartItem) {
        await this.cartsRepository.updateCartItem(
          existingCartItem.id,
          item.qty,
        );
      } else {
        await this.cartsRepository.createCartItem(
          cartId,
          item.product_id,
          item.qty,
        );
      }
    }

    return this.cartsRepository.getCartById(cartId);
  }
}
