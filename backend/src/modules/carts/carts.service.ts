import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartsRepository } from './carts.repository';

@Injectable()
export class CartsService {
  constructor(private readonly cartsRepository: CartsRepository) {}

  private async validateProductsAndStock(
    items: { product_id: number; qty: number }[],
  ) {
    const productIds = items.map((i) => i.product_id);
    const products = await this.cartsRepository.findProductsByIds(productIds);

    const existingIds = new Set(products.map((p) => p.id));
    const notFound = productIds.filter((id) => !existingIds.has(id));
    if (notFound.length > 0) {
      throw new NotFoundException(
        `Productos no encontrados: ${notFound.join(', ')}`,
      );
    }

    const outOfStock = items.filter((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return product && product.stock < item.qty;
    });

    if (outOfStock.length > 0) {
      const messages = outOfStock.map(
        (i) => `ID ${i.product_id} sin stock suficiente`,
      );
      throw new BadRequestException(messages.join('; '));
    }
  }

  async createCart(items: { product_id: number; qty: number }[]) {
    if (items.length === 0) {
      throw new BadRequestException('No se puede crear un carrito sin ítems');
    }

    await this.validateProductsAndStock(items);
    const cart = await this.cartsRepository.createCart(items);
    await this.cartsRepository.decrementStock(items);
    return cart;
  }

  async updateCartItems(
    cartId: number,
    items: { product_id: number; qty: number }[],
  ) {
    if (items.length === 0) {
      throw new BadRequestException(
        'No se puede actualizar con una lista vacía',
      );
    }

    await this.validateProductsAndStock(items);
    const cart = await this.cartsRepository.updateCartItemsTransactional(
      cartId,
      items,
    );
    await this.cartsRepository.decrementStock(items);
    return cart;
  }
}
