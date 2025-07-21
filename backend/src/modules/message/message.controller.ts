import { Controller, Post, Body } from '@nestjs/common';
import { MessageService } from './message.service';
import {
  DATABASE_URL,
  PORT,
  OPENAI_API_KEY,
  OPENAI_MODEL,
  OPENAI_TEMPERATURE,
  OPENAI_TIMEOUT_MS,
  OPENAI_MAX_RETRIES,
  SESSION_TTL_MS,
  SESSION_MAX_MESSAGES,
} from 'src/config/env.loader';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}
  @Post()
  async handleMessage(@Body() body: { message: string; sessionId?: string }) {
    console.log(
      'envs',
      DATABASE_URL,
      PORT,
      OPENAI_API_KEY,
      OPENAI_MODEL,
      OPENAI_TEMPERATURE,
      OPENAI_TIMEOUT_MS,
      OPENAI_MAX_RETRIES,
      SESSION_TTL_MS,
      SESSION_MAX_MESSAGES,
    );
    const response = await this.messageService.processUserMessage(body.message, body.sessionId);
    return { response };
  }
}
