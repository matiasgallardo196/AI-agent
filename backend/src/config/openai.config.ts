export const openaiConfig = {
  model: process.env.OPENAI_MODEL || 'gpt-4',
  temperature: Number(process.env.OPENAI_TEMPERATURE ?? '0.2'),
  timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS ?? '10000'),
  maxRetries: Number(process.env.OPENAI_MAX_RETRIES ?? '2'),
};
