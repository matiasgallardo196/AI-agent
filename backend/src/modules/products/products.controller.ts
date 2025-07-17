import { Controller, Get } from '@nestjs/common';

@Controller('products')
export class ProductsController {
  @Get()
  getProducts() {
    // Aquí iría la lógica para obtener los productos
    return 'Lista de productos';
  }

  @Get(':id')
  getProductById() {
    // Aquí iría la lógica para obtener un producto por ID
    return 'Producto por ID';
  }
}
