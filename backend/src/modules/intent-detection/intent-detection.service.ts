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
    console.log('Extracting cart items from text:', text);
    //console.log('History for cart extraction:', history);
    const system = `
                  Eres un asistente de compras. Tienes acceso a una lista de productos previamente mostrados al usuario.
                  El usuario mencionará cantidades y descripciones, y tú debes identificar a qué producto se refiere usando coincidencia exacta o aproximada con los nombres anteriores.

                  Devuelve un array JSON con los productos seleccionados, usando el formato:
                  [ { "product_id": <ID>, "qty": <cantidad> } ]

                  Usa únicamente los IDs de los productos que fueron mostrados anteriormente.
                  Responde solo con el array, sin explicaciones.
                  `;

    const raw = await this.openaiService.askChat([
      { role: 'system', content: system },
      ...history,
      { role: 'user', content: text },
    ]);
    try {
      return JSON.parse(raw);
    } catch {
      throw new BadRequestException('No se pudieron interpretar los ítems del carrito.');
    }
  }
}
