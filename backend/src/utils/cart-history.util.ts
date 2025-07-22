import axios from 'axios';
import { BASE_URL } from '../config/env.loader';
import { ChatMessage } from './chat-message.type';

export type InferredCartInfo = {
  id: number;
  items: { product_id: number; name: string; qty: number }[];
};

export async function getCartFromSessionHistory(
  history: ChatMessage[],
): Promise<InferredCartInfo | null> {
  const reversed = [...history].reverse();
  const last = reversed.find((m) =>
    /carrito generado/i.test(m.content),
  );
  if (!last) return null;
  const match = last.content.match(/carrito generado(?: es)?:?\s*(\d+)/i);
  if (!match) return null;
  const id = parseInt(match[1], 10);
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
