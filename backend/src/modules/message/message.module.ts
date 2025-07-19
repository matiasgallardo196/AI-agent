import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { IntentDetectionService } from '../intent-detection/intent-detection.service';
import { ProductsService } from '../products/products.service';
import { CartsService } from '../carts/carts.service';
import { OpenAiService } from '../openai/openai.service';
import { ProductsModule } from '../products/products.module';
import { IntentDetectionModule } from '../intent-detection/intent-detection.module';
import { OpenAiModule } from '../openai/openai.module';
import { CartsModule } from '../carts/carts.module';

@Module({
  imports: [ProductsModule, IntentDetectionModule, CartsModule, OpenAiModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
