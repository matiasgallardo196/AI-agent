import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatMessage } from '../../utils/chat-message.type';

@Injectable()
export class OpenAiService {
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly model = /*'gpt-3.5-turbo';*/ 'gpt-4';
  private readonly client: OpenAI;

  constructor() {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY no definido');
    }
    this.client = new OpenAI({ apiKey: this.apiKey });
  }

  async askChat(messages: ChatMessage[], temperature: number = 0.2): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.choices[0].message.content.trim();
  }

  // Método general: recibe prompt y devuelve string plano
  async askRaw(prompt: string, temperature?: number): Promise<string> {
    return this.askChat([{ role: 'user', content: prompt }], temperature);
  }

  // Método específico: transforma un resultado en una respuesta natural
  async rephraseForUser(
    params: { data: any; intention: string; userMessage?: string; history?: ChatMessage[] },
    temperature?: number,
  ): Promise<string> {
    const prompt = this.buildPrompt(params);

    try {
      const response = await this.askChat(
        [...(params.history || []), { role: 'user', content: prompt }],
        temperature,
      );
      return response;
    } catch (err) {
      console.error('❌ Error en rephraseForUser:', err.message || err);
      return Array.isArray(params.data)
        ? params.data.map((p) => p.name).join(', ')
        : JSON.stringify(params.data);
    }
  }

  private buildPrompt({
    data,
    intention,
    userMessage,
  }: {
    data: any;
    intention: string;
    userMessage?: string;
  }): string {
    const cleaned = JSON.parse(
      JSON.stringify(data, (key, value) =>
        key === 'embedding' || key === 'score' ? undefined : value,
      ),
    );

    const summary = Array.isArray(cleaned)
      ? cleaned
          .map((p, i) => `${i + 1}. ${p.name} - $${p.price} - ${p.description}`)
          .slice(0, 10)
          .join('\n')
      : JSON.stringify(cleaned, null, 2);

    switch (intention) {
      case 'get_products':
        return `Eres un agente comercial amable. El usuario pidió ver productos. Reformula esta información de forma clara y atractiva:\n\n${summary}`;

      case 'create_cart':
        return `El usuario acaba de crear un carrito con estos productos:\n\n${summary}\nConfirma la creación de forma amistosa.`;

      case 'update_cart':
        return `El usuario modificó su carrito. Los productos ahora son:\n\n${summary}\nConfirma los cambios de forma clara.`;

      case 'fallback':
      default:
        return `Eres un agente comercial amigable llamado Cristian. Estás dentro de un sistema que solo permite ayudarte a:

                    1. Ver productos disponibles.
                    2. Consultar detalles de un producto.
                    3. Crear un carrito de compras.
                    4. Modificar un carrito existente.

                    El usuario escribió: "${userMessage}"

                    No puedes ayudar con pagos, envíos, datos personales, ni realizar compras reales.

                    Formula una pregunta amistosa y clara para redirigir al usuario hacia una de las funciones que sí puedes realizar. Si el mensaje es muy confuso, intenta guiarlo con ejemplos como: "¿Querés que te muestre los productos disponibles?" o "¿Estás buscando algo específico?".
                      `.trim();
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return res.data[0].embedding;
  }
}
