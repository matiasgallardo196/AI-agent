import { IntentDetectionService } from '../../intent-detection/intent-detection.service';
import { CartsService } from '../../carts/carts.service';
import { OpenAiService } from '../../openai/openai.service';
import { SessionManagerService } from '../../session-manager/session-manager.service';
import { IntentName } from '../../intent-detection/intents';
import { ChatMessage } from '../../../utils/chat-message.type';
import { BadRequestException, NotFoundException } from '@nestjs/common';

export function createCreateCartHandler(
  intentDetectionService: IntentDetectionService,
  cartsService: CartsService,
  openaiService: OpenAiService,
  sessionManager: SessionManagerService,
) {
  return async function handleCreateCart(
    text: string,
    sessionId: string | undefined,
    history: ChatMessage[],
    ctx?: { ajustarStock?: boolean },
  ) {
    const items = await intentDetectionService.extractCartItems(text, history);
    let cart;
    try {
      cart = await cartsService.createCart(items);
      if ('errors' in cart && ctx?.ajustarStock) {
        const adjusted = items.map((item) => {
          const err = ('errors' in cart ? cart.errors : []).find(
            (e) => e.productId === item.product_id,
          );
          return err ? { product_id: item.product_id, qty: err.stockDisponible } : item;
        });
        cart = await cartsService.createCart(adjusted);
      }
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        return openaiService.rephraseForUser({
          data: { error: err.message },
          intention: IntentName.CreateCart,
          userMessage: text,
          history,
        });
      }
      throw err;
    }
    if ('items' in cart) {
      if (sessionId) {
        sessionManager.clearPendingAction(sessionId);
      }
    } else if ('errors' in cart) {
      if (sessionId) {
        sessionManager.setPendingAction(sessionId, 'adjust_stock_and_create_cart');
        sessionManager.setLastIntent(sessionId, 'create_cart_error');
      }
    }
    if (sessionId && 'id' in cart && 'items' in cart) {
      sessionManager.setCartId(sessionId, cart.id);
    }

    return openaiService.rephraseForUser({
      data: cart,
      intention: IntentName.CreateCart,
      userMessage: text,
      history,
    });
  };
}
