import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { WhatsappService } from './whatsapp.service';
import { MessageService } from '../message/message.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly messageService: MessageService,
  ) {}

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Body('Body') body: string) {
    const from = (req.body['From'] as string) || '';
    const phone = from.replace('whatsapp:', '');
    const response = await this.messageService.processUserMessage(body, phone);
    await this.whatsappService.sendMessage(phone, response);
    return { ok: true };
  }
}
