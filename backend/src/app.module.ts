import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MessageModule } from './modules/message/message.module';
import { OpenAiModule } from './modules/openai/openai.module';
import { IntentDetectionModule } from './modules/intent-detection/intent-detection.module';
import { ConfigModule } from '@nestjs/config';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MessageModule,
    OpenAiModule,
    IntentDetectionModule,
    WhatsappModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
