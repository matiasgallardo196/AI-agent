export const sessionConfig = {
  ttlMs: Number(process.env.SESSION_TTL_MS ?? 30 * 60 * 1000),
  maxMessages: Number(process.env.SESSION_MAX_MESSAGES ?? 50),
};
