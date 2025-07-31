import { BadRequestException, Injectable } from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service';
import { INTENT_DESCRIPTIONS, IntentName, VALID_INTENTS } from './intents';
import { ChatMessage } from '../../utils/chat-message.type';
import { CartsService } from '../carts/carts.service';

@Injectable()
export class IntentDetectionService {
  constructor(
    private readonly openaiService: OpenAiService,
    private readonly cartsService: CartsService,
  ) {}

  async detectIntent(
    text: string,
    history: ChatMessage[] = [],
  ): Promise<{ name: IntentName; query?: string | null }> {
    const system =
      `Respond ONLY with a plain JSON with fields "intent" and "query".\n\n` +
      `DO NOT use triple quotes, code blocks, or markdown. Only direct JSON response.\n\n` +
      `Valid intentions are:\n` +
      `${INTENT_DESCRIPTIONS.map((i) => `- "${i.name}": ${i.description}`).join('\n')}\n\n` +
      `If you don't understand the intention, use "${IntentName.Fallback}" and leave query as null.`;

    let raw: string;
    try {
      raw = await this.openaiService.askChat([
        { role: 'system', content: system },
        ...history,
        { role: 'user', content: text },
      ]);
    } catch (err) {
      console.error('❌ Error in detectIntent:', err.message || err);
      return { name: IntentName.Fallback, query: null };
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        name: this.normalizeIntent(parsed.intent),
        query: parsed.query ?? null,
      };
    } catch {
      return { name: IntentName.Fallback, query: null };
    }
  }

  async extractQuery(text: string, history: ChatMessage[] = []): Promise<string | null> {
    const system = `If the message mentions a type of clothing, size, color, category or relevant description (like "shirt", "size L", "black color", "something casual", "light clothing"), respond only with those keywords for search. If there's nothing useful to filter products, respond with null.`;

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
              `${i + 1}. ID: ${item.product_id}, Name: "${item.name}", Current quantity: ${item.qty}`,
          )
          .join('\n')
      : null;

    const system = `
    You are a shopping assistant within a system that expects only JSON responses.

    Your task is to identify which products and quantities the user wants to add or modify in their cart.

    ${
      itemsContext
        ? `This is the current list of products in the cart:\n${itemsContext}`
        : `You have access to a list of products previously shown to the user (from history).`
    }

    Always respond with a JSON array using the following format:
    [ { "product_id": <ID>, "qty": <quantity> } ]

    If no valid product can be interpreted, respond with an empty array: []

    DO NOT include explanations, greetings or any other text outside the JSON.
  `.trim();

    const raw = await this.openaiService.askChat([
      { role: 'system', content: system },
      ...history,
      { role: 'user', content: text },
    ]);

    try {
      return JSON.parse(raw);
    } catch {
      console.error('❌ JSON malformed in extractCartItems');
      return [];
    }
  }

  async extractCartInfo(
    text: string,
    history: ChatMessage[] = [],
  ): Promise<ExtractedCartInfo | null> {
    const system =
      `You are an assistant that must identify the cart number mentioned by the user.\n\n` +
      `If the user explicitly indicates a cart number (e.g., "cart 3" or "cart three"), respond only with that number.\n` +
      `If they don't say it but there's a message from the assistant in the history mentioning "the generated cart number is X", use that number.\n` +
      `If you cannot infer any valid number, respond with the word null.`;

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

    const cart = await this.cartsService.findById(id);
    if (!cart) return null;

    const items = await this.cartsService.getItemsWithProductInfo(id);

    return { id, items };
  }
}
type ExtractedCartInfo = {
  id: number;
  items: { product_id: number; name: string; qty: number }[];
};
