import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CartsRepository } from './carts.repository';

@Injectable()
export class CartsService {
  constructor(private readonly cartsRepository: CartsRepository) {}

  private computeDeltas(
    current: { product_id: number; qty: number }[],
    updated: { product_id: number; qty: number }[],
  ) {
    const currentMap = new Map<number, number>(current.map((i) => [i.product_id, i.qty]));
    const updatedMap = new Map<number, number>(updated.map((i) => [i.product_id, i.qty]));

    const allIds = new Set<number>([...currentMap.keys(), ...updatedMap.keys()]);

    const deltas: { product_id: number; delta: number }[] = [];
    for (const id of allIds) {
      const oldQty = currentMap.get(id) ?? 0;
      const newQty = updatedMap.get(id) ?? 0;
      if (oldQty !== newQty) {
        deltas.push({ product_id: id, delta: newQty - oldQty });
      }
    }
    return deltas;
  }

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

  adjustItemsForStock(
    items: { product_id: number; qty: number }[],
    errors: { productId: number; stockDisponible: number }[],
  ) {
    return items.map((item) => {
      const err = errors.find((e) => e.productId === item.product_id);
      return err ? { product_id: item.product_id, qty: err.stockDisponible } : item;
    });
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

    const currentItems = await this.cartsRepository.getCartItems(cartId);
    const deltas = this.computeDeltas(currentItems, items);

    const toValidate = deltas
      .filter((d) => d.delta > 0)
      .map((d) => ({ product_id: d.product_id, qty: d.delta }));

    const { errors } = await this.validateProductsAndStock(toValidate);
    if (errors.length > 0) {
      return { errors };
    }

    const cart = await this.cartsRepository.updateCartItemsTransactional(cartId, items);
    await this.cartsRepository.adjustStockDelta(deltas);
    return cart;
  }

  async findById(id: number) {
    return this.cartsRepository.findById(id);
  }

  async getItemsWithProductInfo(cartId: number) {
    return this.cartsRepository.getItemsWithProductInfo(cartId);
  }
}
