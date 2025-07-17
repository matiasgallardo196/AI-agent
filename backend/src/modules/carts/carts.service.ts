import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  // async getCartItems(cartId: number) {
  //   return this.prisma.cartItem.findMany({
  //     where: { cartId },
  //     include: {
  //       product: true,
  //     },
  //   });
  // }///////////////////////////////////////////////////////PEDIENTE

  async createCart(items: { product_id: number; qty: number }[]) {
    const productIds = items.map((i) => i.product_id);

    const existingProducts = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    const existingIds = new Set(existingProducts.map((p) => p.id));
    const notFound = productIds.filter((id) => !existingIds.has(id));
    if (notFound.length > 0) {
      throw new NotFoundException(
        `Productos no encontrados: ${notFound.join(', ')}`,
      );
    }

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

  async updateCartItems(
    cartId: number,
    items: { product_id: number; qty: number }[],
  ) {
    ////////////////////////////////////////////////////////// VERIFICAR
    // 1. Validar productos
    const productIds = items.map((i) => i.product_id);
    const existingProducts = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    const existingIds = new Set(existingProducts.map((p) => p.id));
    const notFound = productIds.filter((id) => !existingIds.has(id));
    if (notFound.length > 0) {
      throw new NotFoundException(
        `Productos no encontrados: ${notFound.join(', ')}`,
      );
    }

    // 2. Procesar cada ítem: actualizar, crear o eliminar
    for (const item of items) {
      const existingCartItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId,
          productId: item.product_id,
        },
      });

      if (item.qty <= 0) {
        if (existingCartItem) {
          await this.prisma.cartItem.delete({
            where: { id: existingCartItem.id },
          });
        }
        continue;
      }

      if (existingCartItem) {
        await this.prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { qty: item.qty },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cart: { connect: { id: cartId } },
            product: { connect: { id: item.product_id } },
            qty: item.qty,
          },
        });
      }
    }

    // 3. Devolver el carrito actualizado
    return this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  } ////////////////////////////////////////////////////////// VERIFICAR
}
