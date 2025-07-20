import { BadRequestException, Injectable } from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service';
import { INTENT_DESCRIPTIONS, IntentName, VALID_INTENTS } from './intents';
import { ChatMessage } from '../../utils/chat-message.type';

@Injectable()
export class IntentDetectionService {
  constructor(private readonly openaiService: OpenAiService) {}

  async detectIntent(text: string, history: ChatMessage[] = []): Promise<{ name: IntentName }> {
    const system =
      `Responde SOLO con un JSON con los campos "intent" y "query".\n\n` +
      `Las intenciones válidas son:\n` +
      `${INTENT_DESCRIPTIONS.map((i) => `- "${i.name}": ${i.description}`).join('\n')}\n\n` +
      `Si no entiendes la intención, usa "${IntentName.Fallback}" y deja query en null.`;

    const raw = await this.openaiService.askChat([
      { role: 'system', content: system },
      ...history,
      { role: 'user', content: text },
    ]);
    try {
      const parsed = JSON.parse(raw);
      return { name: this.normalizeIntent(parsed.intent) };
    } catch {
      return { name: IntentName.Fallback };
    }
  }

  async extractQuery(text: string, history: ChatMessage[] = []): Promise<string | null> {
    const system = `Si el mensaje menciona un producto, categoría, ingrediente o descripción relevante (como "empanadas", "con queso", "algo con jamón"), responde solo con esas palabras clave para búsqueda. Si no hay nada útil, responde con null.`;

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

  // (Opcional) Extraer ítems para crear carrito desde el mensaje
  async extractCartItems(
    text: string,
    history: ChatMessage[] = [],
  ): Promise<{ product_id: number; qty: number }[]> {
    //console.log('Extracting cart items from text:', text);
    //console.log('History for cart extraction:', history);
    const system = `
          Eres un asistente de compras dentro de un sistema que espera únicamente respuestas en formato JSON.

          Tu tarea es identificar productos y cantidades que el usuario quiere agregar o modificar en su carrito.

          Tienes acceso a una lista de productos previamente mostrados al usuario (desde el historial).

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
    //console.log('raw response for cart items extraction:', raw);
    try {
      return JSON.parse(raw);
    } catch {
      throw new BadRequestException('No se pudieron interpretar los ítems del carrito.');
    }
  }
  async extractCartId(text: string, history: ChatMessage[] = []): Promise<number | null> {
    const system =
      `Eres un asistente que debe identificar el número de carrito mencionado por el usuario.\n\n` +
      `Si el usuario indica un número de carrito explícitamente (por ejemplo \"carrito 3\" o \"carrito tres\"), responde solo con ese número.\n` +
      `Si no lo dice pero en el historial hay un mensaje del asistente que menciona \"el número de carrito generado es X\", utiliza ese número.\n` +
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
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
  }
}
