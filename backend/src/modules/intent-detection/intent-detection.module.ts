import { Module } from '@nestjs/common';
import { IntentDetectionService } from './intent-detection.service';

@Module({
  providers: [IntentDetectionService]
})
export class IntentDetectionModule {}
