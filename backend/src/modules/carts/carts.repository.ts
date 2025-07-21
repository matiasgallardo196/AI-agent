import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class CartsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProductsByIds(ids: number[]) {
    return this.prisma.product.findMany({
      where: { id: { in: ids } },
    });
  }

  async createCart(items: { product_id: number; qty: number }[]) {
    return this.prisma.cart.create({
      data: {
        items: {
          create: items.map((item) => ({
            product: { connect: { id: item.product_id } },
            qty: item.qty,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });
  }

  async updateCartItemsTransactional(cartId: number, items: { product_id: number; qty: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: {
          cartId,
          productId: { notIn: items.map((item) => item.product_id) },
        },
      });

      for (const item of items) {
        const existing = await tx.cartItem.findFirst({
          where: {
            cartId,
            productId: item.product_id,
          },
        });

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { qty: item.qty },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId,
              productId: item.product_id,
              qty: item.qty,
            },
          });
        }
      }

      return tx.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { product: true } } },
      });
    });
  }

  async decrementStock(items: { product_id: number; qty: number }[]) {
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.product.update({
          where: { id: item.product_id },
          data: { stock: { decrement: item.qty } },
        }),
      ),
    );
  }

  async findById(id: number) {
    return this.prisma.cart.findUnique({
      where: { id },
      select: { id: true }, // podés agregar más campos si necesitás
    });
  }

  async getItemsWithProductInfo(cartId: number) {
    const items = await this.prisma.cartItem.findMany({
      where: { cartId },
      include: { product: true },
    });

    return items.map((item) => ({
      product_id: item.productId,
      name: item.product.name,
      qty: item.qty,
    }));
  }
}
