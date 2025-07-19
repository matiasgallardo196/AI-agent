import { BadRequestException, Injectable } from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service';

@Injectable()
export class IntentDetectionService {
  constructor(private readonly openaiService: OpenAiService) {}

  async detectIntent(text: string): Promise<{ name: string }> {
    // Prompt estructurado para que el LLM responda con una intención
    const prompt = `
Eres un agente de atención al cliente. Recibiste el siguiente mensaje:

"${text}"

Clasifica este mensaje en una de las siguientes intenciones:
- get_products
- get_product (detalle)
- create_cart
- update_cart
- fallback (no es una intención válida)

Responde solo con el nombre de la intención. No agregues explicación.
`;

    const response = await this.openaiService.askRaw(prompt);
    // Extraer y normalizar intención
    const name = this.normalizeIntent(response);
    return { name };
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

  normalizeIntent(raw: string): string {
    const lower = raw.trim().toLowerCase();
    const validIntents = [
      'get_products',
      'get_product',
      'create_cart',
      'update_cart',
    ];
    return validIntents.includes(lower) ? lower : 'fallback';
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
