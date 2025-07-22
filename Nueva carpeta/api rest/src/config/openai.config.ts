import {
  OPENAI_MAX_RETRIES,
  OPENAI_MODEL,
  OPENAI_TEMPERATURE,
  OPENAI_TIMEOUT_MS,
} from './env.loader';

export const openaiConfig = {
  model: OPENAI_MODEL ?? 'gpt-4o',
  temperature: Number(OPENAI_TEMPERATURE ?? '0.2'),
  timeoutMs: Number(OPENAI_TIMEOUT_MS ?? '10000'),
  maxRetries: Number(OPENAI_MAX_RETRIES ?? '2'),
};
