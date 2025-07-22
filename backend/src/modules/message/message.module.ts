import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

import { IntentDetectionModule } from '../intent-detection/intent-detection.module';
import { OpenAiModule } from '../openai/openai.module';
import { SessionManagerModule } from '../session-manager/session-manager.module';

@Module({
  imports: [IntentDetectionModule, OpenAiModule, SessionManagerModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
