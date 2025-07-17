import { Module } from '@nestjs/common';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { CartsRepository } from './carts.repository';

@Module({
  controllers: [CartsController],
  providers: [CartsService, CartsRepository],
})
export class CartsModule {}
