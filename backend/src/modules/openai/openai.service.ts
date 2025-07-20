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
        console.log('Creating cart with data:', cleaned);

        // ⚠️ Caso: error por falta de stock
        if ('errors' in cleaned && Array.isArray(cleaned.errors)) {
          const errores = cleaned.errors
            .map((err, i) => {
              return `${i + 1}. ${err.name}: pediste ${err.cantidadSolicitada}, pero solo hay ${err.stockDisponible} disponibles.`;
            })
            .join('\n');

          return `
      Eres un agente comercial llamado Cristian. Estás ayudando al usuario dentro de un sistema de compras por chat.

      No se pudo crear el carrito porque hay productos sin stock suficiente:

      ${errores}

      ¿Querés ajustar las cantidades para continuar con la creación del carrito?

      Podés responder "sí" para usar la cantidad máxima disponible o indicar manualmente las nuevas cantidades.

      Estoy aquí para ayudarte 😊
    `.trim();
        }

        // ✅ Camino feliz: carrito válido con items
        if (!Array.isArray(cleaned.items)) {
          return `No se pudo crear el carrito porque no se encontraron productos válidos.`;
        }

        const productLines = cleaned.items
          .map((item, i) => {
            const name = item.product?.name || `Producto desconocido (ID: ${item.productId})`;
            const price = item.product?.price != null ? item.product.price : null;
            const desc = item.product?.description || '';
            const priceFormatted = price != null ? `$${price.toLocaleString()}` : '';
            return `${i + 1}. ${name} x${item.qty}${priceFormatted ? ` - ${priceFormatted}` : ''}${desc ? ` - ${desc}` : ''}`;
          })
          .join('\n');

        const total = cleaned.items.reduce((acc, item) => {
          const unit = item.product?.price;
          return unit != null ? acc + unit * item.qty : acc;
        }, 0);

        const totalLine =
          total > 0 ? `\n\nTotal estimado de la compra: $${total.toLocaleString()}` : '';

        return `
    Eres un agente comercial amigable llamado Cristian. Estás ayudando al usuario dentro de un sistema de compras por chat.

    El usuario acaba de crear un carrito con los siguientes productos:

    ${productLines}${totalLine}

    El número de carrito generado es: ${cleaned.id}.

    Confirma de forma amistosa la creación del carrito, incluyendo los nombres, cantidades y el total estimado.
    Aclara que si más adelante desea modificar su carrito, puede hacerlo indicando el número de ID ${cleaned.id}.
    Evita lenguaje técnico y hablá como un asesor humano, manteniendo el tono cálido y servicial de Cristian.
  `.trim();

      case 'update_cart':
      case 'update_cart':
        if (userMessage === 'no_cart_found') {
          return `
            No encontré un carrito activo para modificar.
            ¿Podés indicarme el número de carrito que querés editar?
            Por ejemplo: "el 3" o "quiero modificar el carrito 5".
            `.trim();
        }

        if (userMessage === 'no_items_detected') {
          return `
            No pude identificar qué productos querés modificar en tu carrito.
            ¿Podés decirme qué productos querés cambiar y en qué cantidades?
            Por ejemplo: "3 empanadas de carne" o "quiero agregar 2 pizzas de jamón".
            `.trim();
        }

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
