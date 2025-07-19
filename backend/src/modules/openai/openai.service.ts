import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenAiService {
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly model = 'gpt-4'; // o 'gpt-3.5-turbo'

  // Método general: recibe prompt y devuelve string plano
  async askRaw(prompt: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.choices[0].message.content.trim();
  }

  // Método específico: transforma un resultado en una respuesta natural
  async rephraseForUser(params: {
    data: any;
    intention: string;
    userMessage?: string; // útil para fallback
  }): Promise<string> {
    const { data, intention, userMessage } = params;

    const prompt = this.buildPrompt({ data, intention, userMessage });

    return await this.askRaw(prompt);
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
    switch (intention) {
      case 'get_products':
        return `
Eres un agente comercial amable. El usuario pidió ver productos. Reformula esta información para mostrarla de forma clara y atractiva:

${JSON.stringify(data, null, 2)}
`;

      case 'create_cart':
        return `
El usuario acaba de crear un carrito con estos productos:

${JSON.stringify(data.items, null, 2)}

Confirma la creación de forma amistosa.
`;

      case 'update_cart':
        return `
El usuario modificó su carrito. Los productos ahora son:

${JSON.stringify(data.items, null, 2)}

Confirma los cambios de forma clara.
`;

      case 'fallback':
      default:
        return `
Eres un agente comercial amigable. El usuario escribió:

"${userMessage}"

No pudiste detectar una intención clara. Intenta responder amablemente como si fueras humano, sin ejecutar acciones.
`;
    }
  }
}
