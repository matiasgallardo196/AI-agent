import { Injectable } from '@nestjs/common';
import { twilioClient, whatsappFrom } from '../../config/twilio.config';

@Injectable()
export class WhatsappService {
  async sendMessage(to: string, body: string) {
    await twilioClient.messages.create({
      from: whatsappFrom,
      to: `whatsapp:${to}`,
      body,
    });
  }
}
