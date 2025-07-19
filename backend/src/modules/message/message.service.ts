import { Injectable } from '@nestjs/common';
import { IntentDetectionService } from '../intent-detection/intent-detection.service';
import { ProductsService } from '../products/products.service';
import { CartsService } from '../carts/carts.service';
import { OpenAiService } from '../openai/openai.service';
import { IntentName } from '../intent-detection/intents';

@Injectable()
export class MessageService {
  private handlers: Record<IntentName, (text: string, sessionId?: string) => Promise<string>>;
  private sessions = new Map<string, number>();

  constructor(
    private readonly intentDetectionService: IntentDetectionService,
    private readonly productsService: ProductsService,
    private readonly cartsService: CartsService,
    private readonly openaiService: OpenAiService,
  ) {
    this.handlers = {
      [IntentName.GetProducts]: this.handleGetProducts.bind(this),
      [IntentName.CreateCart]: this.handleCreateCart.bind(this),
      [IntentName.UpdateCart]: this.handleUpdateCart.bind(this),
      [IntentName.Fallback]: this.handleFallback.bind(this),
      [IntentName.GetProduct]: this.handleFallback.bind(this),
    } as Record<IntentName, (text: string, sessionId?: string) => Promise<string>>;
  }

  async processUserMessage(text: string, sessionId?: string) {
    const intent = await this.intentDetectionService.detectIntent(text);
    const handler = this.handlers[intent.name] ?? this.handleFallback.bind(this);
    return handler(text, sessionId);
  }

  private async handleGetProducts(text: string) {
    const query = await this.intentDetectionService.extractQuery(text);
    const products = query
      ? await this.productsService.searchProductsSemantic(query)
      : await this.productsService.getAllProducts();
    return this.openaiService.rephraseForUser({
      data: products,
      intention: IntentName.GetProducts,
      userMessage: text,
    });
  }

  private async handleCreateCart(text: string, sessionId?: string) {
    const items = await this.intentDetectionService.extractCartItems(text);
    const cart = await this.cartsService.createCart(items);
    if (sessionId) {
      this.sessions.set(sessionId, cart.id);
    }
    return this.openaiService.rephraseForUser({
      data: cart,
      intention: IntentName.CreateCart,
      userMessage: text,
    });
  }

  private async handleUpdateCart(text: string, sessionId?: string) {
    const cartId = sessionId ? this.sessions.get(sessionId) : undefined;
    if (!cartId) {
      return this.handleFallback('No se encontró un carrito activo.');
    }
    const items = await this.intentDetectionService.extractCartItems(text);
    const cart = await this.cartsService.updateCartItems(cartId, items);
    return this.openaiService.rephraseForUser({
      data: cart,
      intention: IntentName.UpdateCart,
      userMessage: text,
    });
  }

  private async handleFallback(text: string) {
    return this.openaiService.rephraseForUser({
      data: null,
      intention: IntentName.Fallback,
      userMessage: text,
    });
  }
}
