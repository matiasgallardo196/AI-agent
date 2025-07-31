import { Twilio } from 'twilio';
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } from './env.loader';

// Check if Twilio credentials are available
const isTwilioConfigured = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER;

if (!isTwilioConfigured) {
  console.warn('⚠️ Twilio credentials not configured. WhatsApp functionality will be disabled.');
}

export const twilioClient = isTwilioConfigured
  ? new Twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!)
  : null;

export const whatsappFrom = isTwilioConfigured ? `whatsapp:${TWILIO_WHATSAPP_NUMBER}` : null;
