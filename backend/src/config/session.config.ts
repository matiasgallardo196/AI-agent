import { SESSION_MAX_MESSAGES, SESSION_TTL_MS } from './env.loader';

export const sessionConfig = {
  ttlMs: Number(SESSION_TTL_MS ?? 30 * 60 * 1000),
  maxMessages: Number(SESSION_MAX_MESSAGES ?? 50),
};
