import { Module } from '@nestjs/common';
import { IntentDetectionService } from './intent-detection.service';
import { OpenAiService } from '../openai/openai.service';

@Module({
  providers: [IntentDetectionService, OpenAiService],
  exports: [IntentDetectionService],
})
export class IntentDetectionModule {}
