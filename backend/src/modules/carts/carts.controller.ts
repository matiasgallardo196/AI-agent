import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CartsService } from './carts.service';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  createCart(@Body('items') items: { product_id: number; qty: number }[]) {
    return this.cartsService.createCart(items);
  }

  @Patch(':id')
  updateCart(
    @Param('id') cartId: number,
    @Body('items') items: { product_id: number; qty: number }[],
  ) {
    return this.cartsService.updateCartItems(Number(cartId), items);
  }

  @Get()
  getCarts() {
    return 'this.cartsService.getCarts();';
  }
}
