import { Controller, Patch, Post } from '@nestjs/common';

@Controller('carts')
export class CartsController {
  @Post()
  createCart() {
    // Aquí iría la lógica para crear un carrito
    return 'Carrito creado';
  }

  @Patch(':id')
  updateCart() {
    // Aquí iría la lógica para actualizar un carrito por ID
    return 'Carrito actualizado';
  }
}
