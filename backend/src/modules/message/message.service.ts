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
      ctx?: Record<string, any>,
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
        ctx?: Record<string, any>,
      ) => Promise<string>
    >;
  }

  private isAffirmative(text: string) {
    return /^(sí|si|dale|ok|okay|claro|vale|de acuerdo|por supuesto|seguro|perfecto|así es|obvio|obviamente|cierto|eso es)$/i.test(
      text.trim().toLowerCase(),
    );
  }

  async processUserMessage(text: string, sessionId?: string) {
    const history = sessionId ? this.sessionManager.getMessages(sessionId) : [];
    console.log(`Processing message: "${text}"`);
    console.log('History for session:', history);
    let intent = await this.intentDetectionService.detectIntent(text, history);

    const context: Record<string, any> = {};
    if (sessionId) {
      const pending = this.sessionManager.getPendingAction(sessionId);
      if (pending === 'adjust_stock_and_create_cart' && this.isAffirmative(text)) {
        intent = { name: IntentName.CreateCart };
        context.ajustarStock = true;
        this.sessionManager.clearPendingAction(sessionId);
      }
    }
    const updatedHistory: ChatMessage[] = [...history, { role: 'user', content: text }];
    if (sessionId) {
      this.sessionManager.addMessage(sessionId, {
        role: 'user',
        content: text,
      });
    }
    const handler = this.handlers[intent.name] ?? this.handleFallback.bind(this);
    console.log(`Detected intent: ${intent.name}`);
    //console.log('Updated history:', updatedHistory);
    if (sessionId) {
      this.sessionManager.setLastIntent(sessionId, intent.name);
    }
    const response = await handler(text, sessionId, updatedHistory, context);
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
    sessionId: string | undefined,
    history: ChatMessage[],
    _ctx?: Record<string, any>,
  ) {
    const query = await this.intentDetectionService.extractQuery(text, history);
    console.log('Extracted query for products:', query);
    const products = query
      ? await this.productsService.searchProductsSemantic(query)
      : await this.productsService.getAllProducts();
    //console.log('Products found:', products);
    if (sessionId) {
      const productSummary = products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
      }));

      const naturalContent = productSummary
        .map((p, i) => `${i + 1}. ${p.name} (ID: ${p.id}) - ${p.description}`)
        .join('\n');

      //console.log('Product summary for session:', naturalContent);

      this.sessionManager.addMessage(sessionId, {
        role: 'assistant',
        content: `Aquí tienes una lista de productos disponibles:\n\n${naturalContent}`,
      });
    }

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
    ctx?: { ajustarStock?: boolean },
  ) {
    const items = await this.intentDetectionService.extractCartItems(text, history);
    //console.log('Items extracted for cart creation :', items);
    let cart = await this.cartsService.createCart(items);
    if ('errors' in cart && ctx?.ajustarStock) {
      const adjusted = items.map((item) => {
        const err = ('errors' in cart ? cart.errors : []).find(
          (e) => e.productId === item.product_id,
        );
        return err ? { product_id: item.product_id, qty: err.stockDisponible } : item;
      });
      cart = await this.cartsService.createCart(adjusted);
    }
    //console.log('Cart created:', cart);
    if ('items' in cart) {
      //console.log('Cart items:', cart.items);
      if (sessionId) {
        this.sessionManager.clearPendingAction(sessionId);
      }
    } else if ('errors' in cart) {
      console.log('Errores en el  carrito:', cart.errors);
      if (sessionId) {
        this.sessionManager.setPendingAction(sessionId, 'adjust_stock_and_create_cart');
        this.sessionManager.setLastIntent(sessionId, 'create_cart_error');
      }
    }
    //console.log('History for cart creation:', history);
    if (sessionId && 'id' in cart && 'items' in cart) {
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
    _ctx?: Record<string, any>,
  ) {
    //console.log('Handling update cart for text:', text);
    const cartId = await this.intentDetectionService.extractCartId(text, history);
    //console.log('Cart ID for update:', cartId);
    if (!cartId) {
      return this.openaiService.rephraseForUser({
        data: null,
        intention: IntentName.UpdateCart,
        userMessage: 'no_cart_found',
        history,
      });
    }
    const items = await this.intentDetectionService.extractCartItems(text, history);
    console.log('Items extracted for cart update:', items);
    if (items.length === 0) {
      return this.openaiService.rephraseForUser({
        data: null,
        intention: IntentName.UpdateCart,
        userMessage: 'no_items_detected',
        history,
      });
    }
    const cart = await this.cartsService.updateCartItems(cartId, items);
    return this.openaiService.rephraseForUser({
      data: cart,
      intention: IntentName.UpdateCart,
      userMessage: text,
      history,
    });
  }

  private async handleFallback(
    text: string,
    _sessionId: string | undefined,
    history: ChatMessage[],
    _ctx?: Record<string, any>,
  ) {
    return this.openaiService.rephraseForUser(
      {
        data: null,
        intention: IntentName.Fallback,
        userMessage: text,
        history,
      },
      0.7,
    );
  }
}
