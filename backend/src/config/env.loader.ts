import * as dotenv from 'dotenv';
dotenv.config();

export const DATABASE_URL = process.env.DATABASE_URL;
export const PORT = process.env.PORT;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const OPENAI_MODEL = process.env.OPENAI_MODEL;
export const OPENAI_TEMPERATURE = process.env.OPENAI_TEMPERATURE;
export const OPENAI_TIMEOUT_MS = process.env.OPENAI_TIMEOUT_MS;
export const OPENAI_MAX_RETRIES = process.env.OPENAI_MAX_RETRIES;
export const SESSION_TTL_MS = process.env.SESSION_TTL_MS;
export const SESSION_MAX_MESSAGES = process.env.SESSION_MAX_MESSAGES;
