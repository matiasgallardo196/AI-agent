import { Injectable } from '@nestjs/common';
import { IntentDetectionService } from '../intent-detection/intent-detection.service';
import { ProductsService } from '../products/products.service';
import { CartsService } from '../carts/carts.service';
import { OpenAiService } from '../openai/openai.service';
import { IntentName } from '../intent-detection/intents';
import { SessionManagerService } from '../session-manager/session-manager.service';
import { ChatMessage } from '../../utils/chat-message.type';

@Injectable()
export class MessageService {
  private handlers: Record<
    IntentName,
    (
      text: string,
      sessionId: string | undefined,
      history: ChatMessage[],
    ) => Promise<string>
  >;
  private sessions = new Map<string, number>();

  constructor(
    private readonly intentDetectionService: IntentDetectionService,
    private readonly productsService: ProductsService,
    private readonly cartsService: CartsService,
    private readonly openaiService: OpenAiService,
    private readonly sessionManager: SessionManagerService,
  ) {
    this.handlers = {
      [IntentName.GetProducts]: this.handleGetProducts.bind(this),
      [IntentName.CreateCart]: this.handleCreateCart.bind(this),
      [IntentName.UpdateCart]: this.handleUpdateCart.bind(this),
      [IntentName.Fallback]: this.handleFallback.bind(this),
      [IntentName.GetProduct]: this.handleFallback.bind(this),
    } as Record<
      IntentName,
      (
        text: string,
        sessionId: string | undefined,
        history: ChatMessage[],
      ) => Promise<string>
    >;
  }

  async processUserMessage(text: string, sessionId?: string) {
    const history = sessionId ? this.sessionManager.getMessages(sessionId) : [];
    const intent = await this.intentDetectionService.detectIntent(
      text,
      history,
    );
    const updatedHistory: ChatMessage[] = [
      ...history,
      { role: 'user', content: text },
    ];
    if (sessionId) {
      this.sessionManager.addMessage(sessionId, {
        role: 'user',
        content: text,
      });
    }
    const handler =
      this.handlers[intent.name] ?? this.handleFallback.bind(this);
    const response = await handler(text, sessionId, updatedHistory);
    if (sessionId) {
      this.sessionManager.addMessage(sessionId, {
        role: 'assistant',
        content: response,
      });
    }
    return response;
  }

  private async handleGetProducts(
    text: string,
    _sessionId: string | undefined,
    history: ChatMessage[],
  ) {
    const query = await this.intentDetectionService.extractQuery(text, history);
    const products = query
      ? await this.productsService.searchProductsSemantic(query)
      : await this.productsService.getAllProducts();
    return this.openaiService.rephraseForUser({
      data: products,
      intention: IntentName.GetProducts,
      userMessage: text,
      history,
    });
  }

  private async handleCreateCart(
    text: string,
    sessionId: string | undefined,
    history: ChatMessage[],
  ) {
    const items = await this.intentDetectionService.extractCartItems(
      text,
      history,
    );
    const cart = await this.cartsService.createCart(items);
    if (sessionId) {
      this.sessions.set(sessionId, cart.id);
    }
    return this.openaiService.rephraseForUser({
      data: cart,
      intention: IntentName.CreateCart,
      userMessage: text,
      history,
    });
  }

  private async handleUpdateCart(
    text: string,
    sessionId: string | undefined,
    history: ChatMessage[],
  ) {
    const cartId = sessionId ? this.sessions.get(sessionId) : undefined;
    if (!cartId) {
      return this.handleFallback('No se encontró un carrito activo.', history);
    }
    const items = await this.intentDetectionService.extractCartItems(
      text,
      history,
    );
    const cart = await this.cartsService.updateCartItems(cartId, items);
    return this.openaiService.rephraseForUser({
      data: cart,
      intention: IntentName.UpdateCart,
      userMessage: text,
      history,
    });
  }

  private async handleFallback(text: string, history: ChatMessage[]) {
    return this.openaiService.rephraseForUser({
      data: null,
      intention: IntentName.Fallback,
      userMessage: text,
      history,
    });
  }
}
