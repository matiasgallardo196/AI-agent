import { Injectable } from '@nestjs/common';
import { twilioClient, whatsappFrom } from '../../config/twilio.config';

@Injectable()
export class WhatsappService {
  async sendMessage(to: string, body: string) {
    if (!twilioClient || !whatsappFrom) {
      console.warn('⚠️ WhatsApp service not available - Twilio not configured');
      return;
    }

    try {
      await twilioClient.messages.create({
        from: whatsappFrom,
        to: `whatsapp:${to}`,
        body,
      });
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
    }
  }
}
