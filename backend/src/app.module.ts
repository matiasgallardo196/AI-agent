import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MessageModule } from './modules/message/message.module';
import { ProductsModule } from './modules/products/products.module';
import { CartsModule } from './modules/carts/carts.module';
import { OpenAiModule } from './modules/openai/openai.module';
import { IntentDetectionModule } from './modules/intent-detection/intent-detection.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    MessageModule,
    ProductsModule,
    CartsModule,
    OpenAiModule,
    IntentDetectionModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
