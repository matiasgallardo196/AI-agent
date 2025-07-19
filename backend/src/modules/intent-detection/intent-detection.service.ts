import { BadRequestException, Injectable } from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service';
import { IntentName, VALID_INTENTS } from './intents';
import { ChatMessage } from '../../utils/chat-message.type';

@Injectable()
export class IntentDetectionService {
  constructor(private readonly openaiService: OpenAiService) {}

  async detectIntent(text: string, history: ChatMessage[] = []): Promise<{ name: IntentName }> {
    const system =
      `Responde SOLO con un JSON con los campos \"intent\" y \"query\". ` +
      `Las intenciones válidas son: ${VALID_INTENTS.join(', ')}. ` +
      `Si no entiendes la intención usa \"${IntentName.Fallback}\" y deja query en null.`;

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
    const system = `Extrae una lista de productos con cantidad en formato JSON, por ejemplo: [{ "product_id": 3, "qty": 2 }]. Responde solo con el array.`;

    const raw = await this.openaiService.askChat([
      { role: 'system', content: system },
      ...history,
      { role: 'user', content: text },
    ]);
    try {
      return JSON.parse(raw);
    } catch {
      throw new BadRequestException(
        'No se pudieron interpretar los ítems del carrito.',
      );
    }
  }
}
