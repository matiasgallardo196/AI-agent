import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MessageModule } from './modules/message/message.module';
import { ProductsModule } from './modules/products/products.module';
import { CartsModule } from './modules/carts/carts.module';
import { OpenaiModule } from './modules/openai/openai.module';
import { IntentDetectionModule } from './modules/intent-detection/intent-detection.module';

@Module({
  imports: [
    MessageModule,
    ProductsModule,
    CartsModule,
    OpenaiModule,
    IntentDetectionModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
