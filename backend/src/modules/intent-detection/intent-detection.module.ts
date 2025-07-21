import { Module } from '@nestjs/common';
import { IntentDetectionService } from './intent-detection.service';
import { OpenAiModule } from '../openai/openai.module';
import { CartsModule } from '../carts/carts.module';

@Module({
  imports: [OpenAiModule, CartsModule],
  providers: [IntentDetectionService],
  exports: [IntentDetectionService],
})
export class IntentDetectionModule {}
