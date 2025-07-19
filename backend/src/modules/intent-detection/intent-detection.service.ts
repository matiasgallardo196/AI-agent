import { BadRequestException, Injectable } from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service';
import { IntentName, VALID_INTENTS } from './intents';

@Injectable()
export class IntentDetectionService {
  constructor(private readonly openaiService: OpenAiService) {}

  async detectIntent(text: string): Promise<{ name: IntentName }> {
    const prompt =
      `Recibiste el mensaje del usuario: "${text}".\n` +
      `Responde SOLAMENTE con un JSON que tenga los campos \`intent\` y \`query\`.\n` +
      `Las intenciones válidas son: ${VALID_INTENTS.join(', ')}.\n` +
      `Si no entiendes la intención usa \"${IntentName.Fallback}\" y deja query en null.`;

    const raw = await this.openaiService.askRaw(prompt);
    try {
      const parsed = JSON.parse(raw);
      return { name: this.normalizeIntent(parsed.intent) };
    } catch {
      return { name: IntentName.Fallback };
    }
  }

  async extractQuery(text: string): Promise<string | null> {
    const prompt = `
Recibiste el siguiente mensaje del cliente:

"${text}"

Si el mensaje menciona un producto, categoría, ingrediente o descripción relevante (como "empanadas", "con queso", "algo con jamón"), extrae solo esas palabras clave para una búsqueda.

Si no hay nada útil para buscar, responde solo con: null

Responde solo con el texto extraído o "null", sin explicación.
  `;

    const result = await this.openaiService.askRaw(prompt);
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
  ): Promise<{ product_id: number; qty: number }[]> {
    const prompt = `
Mensaje del usuario:
"${text}"

Extrae una lista de productos con cantidad como objetos JSON. Ejemplo de salida:
[
  { "product_id": 3, "qty": 2 },
  { "product_id": 5, "qty": 1 }
]

No expliques nada. Responde solo con el array JSON.
    `;

    const raw = await this.openaiService.askRaw(prompt);
    try {
      return JSON.parse(raw);
    } catch {
      throw new BadRequestException(
        'No se pudieron interpretar los ítems del carrito.',
      );
    }
  }
}
