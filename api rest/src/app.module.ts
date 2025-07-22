import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ProductsModule } from './modules/products/products.module';
import { CartsModule } from './modules/carts/carts.module';
import { OpenAiModule } from './modules/openai/openai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ProductsModule,
    CartsModule,
    OpenAiModule,

    PrismaModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
