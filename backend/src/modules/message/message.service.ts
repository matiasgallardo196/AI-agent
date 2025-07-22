import { Injectable } from '@nestjs/common';
import { IntentDetectionService } from '../intent-detection/intent-detection.service';
import { ProductsService } from '../products/products.service';
import { CartsService } from '../carts/carts.service';
import { OpenAiService } from '../openai/openai.service';
import { IntentName } from '../intent-detection/intents';
import { SessionManagerService } from '../session-manager/session-manager.service';
import { ChatMessage } from '../../utils/chat-message.type';
import { createGetProductsHandler } from './handlers/get-products.handler';
import { createCreateCartHandler } from './handlers/create-cart.handler';
import { createUpdateCartHandler } from './handlers/update-cart.handler';
import { createFallbackHandler } from './handlers/fallback.handler';

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

  constructor(
    private readonly intentDetectionService: IntentDetectionService,
    private readonly productsService: ProductsService,
    private readonly cartsService: CartsService,
    private readonly openaiService: OpenAiService,
    private readonly sessionManager: SessionManagerService,
  ) {
    this.handlers = {
      [IntentName.GetProducts]: createGetProductsHandler(
        this.intentDetectionService,
        this.productsService,
        this.openaiService,
        this.sessionManager,
      ),
      [IntentName.CreateCart]: createCreateCartHandler(
        this.intentDetectionService,
        this.cartsService,
        this.openaiService,
        this.sessionManager,
      ),
      [IntentName.UpdateCart]: createUpdateCartHandler(
        this.intentDetectionService,
        this.cartsService,
        this.openaiService,
        this.sessionManager,
      ),
      [IntentName.Fallback]: createFallbackHandler(this.openaiService),
      [IntentName.GetProduct]: createFallbackHandler(this.openaiService),
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

    let intent = await this.intentDetectionService.detectIntent(text, history);
    const context: Record<string, any> = {};
    if (intent.query !== undefined) {
      context.query = intent.query;
    }
    if (sessionId) {
      const pending = this.sessionManager.getPendingAction(sessionId);
      if (pending === 'adjust_stock_and_create_cart' && this.isAffirmative(text)) {
        intent = { name: IntentName.CreateCart };
        context.ajustarStock = true;
        this.sessionManager.clearPendingAction(sessionId);
      } else if (pending === 'adjust_stock_and_update_cart' && this.isAffirmative(text)) {
        intent = { name: IntentName.UpdateCart };
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
    const handler = this.handlers[intent.name] ?? this.handlers[IntentName.Fallback];

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
}
