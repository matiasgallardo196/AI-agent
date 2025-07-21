import { Controller, Post, Body } from '@nestjs/common';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}
  @Post()
  async handleMessage(@Body() body: { message: string; sessionId?: string }) {
    const response = await this.messageService.processUserMessage(
      body.message,
      body.sessionId,
    );
    return { response };
  }
}
