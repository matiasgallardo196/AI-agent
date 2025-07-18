import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class CartsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findExistingProductIds(ids: number[]) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return products.map((p) => p.id);
  }

  async findProductsByIds(ids: number[]) {
    return this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, stock: true },
    });
  }

  async createCart(items: { product_id: number; qty: number }[]) {
    return this.prisma.cart.create({
      data: {
        items: {
          create: items.map(({ product_id, qty }) => ({
            product: { connect: { id: product_id } },
            qty,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });
  }

  async findCartItem(cartId: number, productId: number) {
    return this.prisma.cartItem.findFirst({
      where: { cartId, productId },
    });
  }

  async createCartAndUpdateStock(items: { product_id: number; qty: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.create({
        data: {
          items: {
            create: items.map(({ product_id, qty }) => ({
              product: { connect: { id: product_id } },
              qty,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const { product_id, qty } of items) {
        await tx.product.update({
          where: { id: product_id },
          data: { stock: { decrement: qty } },
        });
      }

      return cart;
    });
  }

  async updateCartItem(id: number, qty: number) {
    return this.prisma.cartItem.update({
      where: { id },
      data: { qty },
    });
  }

  async deleteCartItem(id: number) {
    return this.prisma.cartItem.delete({ where: { id } });
  }

  async createCartItem(cartId: number, productId: number, qty: number) {
    return this.prisma.cartItem.create({
      data: {
        cart: { connect: { id: cartId } },
        product: { connect: { id: productId } },
        qty,
      },
    });
  }

  async getCartById(cartId: number) {
    return this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  }
}
