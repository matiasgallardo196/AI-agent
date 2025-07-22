import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_NUMBER,
} from '../../config/env.loader';

@Injectable()
export class WhatsappService {
  private client: Twilio;
  private from: string;

  constructor() {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      throw new Error('Twilio credentials are not configured');
    }
    this.client = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    this.from = `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;
  }

  async sendMessage(to: string, body: string) {
    await this.client.messages.create({
      from: this.from,
      to: `whatsapp:${to}`,
      body,
    });
  }
}
