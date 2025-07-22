import { BadRequestException, Injectable } from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service';
import { INTENT_DESCRIPTIONS, IntentName, VALID_INTENTS } from './intents';
import { ChatMessage } from '../../utils/chat-message.type';
import axios from 'axios';
import { BASE_URL } from 'src/config/env.loader';

@Injectable()
export class IntentDetectionService {
  constructor(private readonly openaiService: OpenAiService) {}

  async detectIntent(
    text: string,
    history: ChatMessage[] = [],
  ): Promise<{ name: IntentName; query?: string | null }> {
    const system =
      `Responde SOLO con un JSON plano con los campos "intent" y "query".\n\n` +
      `NO uses comillas triples, bloques de código, ni markdown. Solo la respuesta JSON directa.\n\n` +
      `Las intenciones válidas son:\n` +
      `${INTENT_DESCRIPTIONS.map((i) => `- "${i.name}": ${i.description}`).join('\n')}\n\n` +
      `Si no entiendes la intención, usa "${IntentName.Fallback}" y deja query en null.`;

    let raw: string;
    try {
      //console.log(`📤 Enviando a OpenAI:`, { system, history, text });
      raw = await this.openaiService.askChat([
        { role: 'system', content: system },
        ...history,
        { role: 'user', content: text },
      ]);
    } catch (err) {
      console.error('❌ Error en detectIntent:', err.message || err);
      return { name: IntentName.Fallback, query: null };
    }
    let intent: IntentName = IntentName.Fallback;
    let query: string | null = null;
    try {
      const parsed = JSON.parse(raw);
      intent = this.normalizeIntent(parsed.intent);
      query = parsed.query ?? null;
    } catch {
      intent = IntentName.Fallback;
    }

    if (intent === IntentName.Fallback) {
      const heuristic = this.heuristicIntent(text);
      if (heuristic) {
        intent = heuristic;
      }
    }

    return { name: intent, query };
  }

  async extractQuery(text: string, history: ChatMessage[] = []): Promise<string | null> {
    const system = `Si el mensaje menciona un tipo de prenda, talla, color, categoría o descripción relevante (como "camiseta", "talla L", "color negro", "algo casual", "prenda ligera"), responde solo con esas palabras clave para búsqueda. Si no hay nada útil para filtrar productos, responde con null.`;

    const result = await this.openaiService.askChat([
      { role: 'system', content: system },
      ...history,
      { role: 'user', content: text },
    ]);
    const cleaned = result.trim().toLowerCase();
    return cleaned === 'null' ? null : cleaned;
  }

  normalizeIntent(raw: string): IntentName {
    const lower = raw.trim().toLowerCase();
    return (VALID_INTENTS as string[]).includes(lower)
      ? (lower as IntentName)
      : IntentName.Fallback;
  }

  async extractCartItems(
    text: string,
    history: ChatMessage[] = [],
    cartItems?: { product_id: number; name: string; qty: number }[],
  ): Promise<{ product_id: number; qty: number }[]> {
    const itemsContext = cartItems?.length
      ? cartItems
          .map(
            (item, i) =>
              `${i + 1}. ID: ${item.product_id}, Nombre: "${item.name}", Cantidad actual: ${item.qty}`,
          )
          .join('\n')
      : null;

    const system = `
    Eres un asistente de compras dentro de un sistema que espera únicamente respuestas en formato JSON.

    Tu tarea es identificar qué productos y cantidades el usuario quiere agregar o modificar en su carrito.

    ${
      itemsContext
        ? `Esta es la lista actual de productos en el carrito:\n${itemsContext}`
        : `Tienes acceso a una lista de productos previamente mostrados al usuario (desde el historial).`
    }

    Responde siempre con un array JSON usando el siguiente formato:
    [ { "product_id": <ID>, "qty": <cantidad> } ]

    Si no se puede interpretar ningún producto válido, responde con un array vacío: []

    NO incluyas explicaciones, saludos ni ningún otro texto fuera del JSON.
  `.trim();

    const raw = await this.openaiService.askChat([
      { role: 'system', content: system },
      ...history,
      { role: 'user', content: text },
    ]);

    try {
      return JSON.parse(raw);
    } catch {
      console.error('❌ JSON malformado en extractCartItems');
      return [];
    }
  }

  async extractCartInfo(
    text: string,
    history: ChatMessage[] = [],
  ): Promise<ExtractedCartInfo | null> {
    const system =
      `Eres un asistente que debe identificar el número de carrito mencionado por el usuario.\n\n` +
      `Si el usuario indica un número de carrito explícitamente (por ejemplo "carrito 3" o "carrito tres"), responde solo con ese número.\n` +
      `Si no lo dice pero en el historial hay un mensaje del asistente que menciona "el número de carrito generado es X", utiliza ese número.\n` +
      `Si no puedes inferir ningún número válido, responde con la palabra null.`;

    const raw = await this.openaiService.askChat([
      { role: 'system', content: system },
      ...history,
      { role: 'user', content: text },
    ]);

    const cleaned = raw.trim().toLowerCase();
    if (cleaned === 'null') {
      return null;
    }

    const id = parseInt(cleaned, 10);
    if (isNaN(id)) return null;

    try {
      await axios.get(`${BASE_URL}/carts/${id}`);
    } catch {
      return null;
    }

    const items = await axios
      .get(`${BASE_URL}/carts/${id}/items`)
      .then((res) => res.data);

    return { id, items };
  }

  private heuristicIntent(text: string): IntentName | null {
    const lower = text.toLowerCase();
    const updateRegex = /\b(pon[eé]?|dame|hacelo|hacela|hacelo|ponlo|cambi[aá]|agrega|agregá|sum[aá]|quit[aá]|sac[aá]|actualiz[aá]|modifica|modificalo|pon\s*le)\b/;
    if (updateRegex.test(lower) && /\d+/.test(lower)) {
      return IntentName.UpdateCart;
    }
    return null;
  }
}
type ExtractedCartInfo = {
  id: number;
  items: { product_id: number; name: string; qty: number }[];
};
