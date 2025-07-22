import axios from 'axios';
import { BASE_URL } from '../config/env.loader';
import { ChatMessage } from './chat-message.type';
import { OpenAiService } from '../modules/openai/openai.service';
import { Logger } from '@nestjs/common';

export type InferredCartInfo = {
  id: number;
  items: { product_id: number; name: string; qty: number }[];
};

export async function getCartFromSessionHistory(
  history: ChatMessage[],
  openaiService: OpenAiService,
): Promise<InferredCartInfo | null> {
  const logger = new Logger('CartHistoryUtil');
  const reversed = [...history].reverse();
  const last = reversed.find((m) =>
    /carrito generado/i.test(m.content),
  );
  if (!last) return null;
  const prompt =
    `Extra\u00e9 del siguiente mensaje el n\u00famero de carrito mencionado y respond\u00e9 solo con ese n\u00famero o null en caso de no encontrarlo: "${last.content}"`;
  logger.debug(`Prompt enviado: ${prompt}`);
  let raw: string;
  try {
    raw = await openaiService.askChat([{ role: 'user', content: prompt }]);
  } catch (err) {
    logger.warn(`OpenAI error: ${err.message}`);
    return null;
  }
  logger.debug(`Respuesta: ${raw}`);
  const cleaned = raw.trim().toLowerCase();
  if (cleaned === 'null') return null;
  const id = parseInt(cleaned, 10);
  if (isNaN(id)) return null;
  try {
    await axios.get(`${BASE_URL}/carts/${id}`);
    const items = await axios
      .get(`${BASE_URL}/carts/${id}/items`)
      .then((res) => res.data);
    return { id, items };
  } catch {
    return null;
  }
}
