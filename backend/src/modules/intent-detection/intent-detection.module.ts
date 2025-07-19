import { Module } from '@nestjs/common';
import { IntentDetectionService } from './intent-detection.service';
import { OpenAiModule } from '../openai/openai.module';

@Module({
  imports: [OpenAiModule],
  providers: [IntentDetectionService],
  exports: [IntentDetectionService],
})
export class IntentDetectionModule {}
