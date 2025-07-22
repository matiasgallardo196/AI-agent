import { IntentDetectionService } from '../../intent-detection/intent-detection.service';
import { CartsService } from '../../carts/carts.service';
import { OpenAiService } from '../../openai/openai.service';
import { IntentName } from '../../intent-detection/intents';
import { ChatMessage } from '../../../utils/chat-message.type';
import { SessionManagerService } from '../../session-manager/session-manager.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

export function createUpdateCartHandler(
  intentDetectionService: IntentDetectionService,
  cartsService: CartsService,
  openaiService: OpenAiService,
  sessionManager: SessionManagerService,
) {
  return async function handleUpdateCart(
    text: string,
    sessionId: string | undefined,
    history: ChatMessage[],
    ctx?: { ajustarStock?: boolean },
  ) {
    const cartInfo = await intentDetectionService.extractCartInfo(text, history);

    if (!cartInfo) {
      return openaiService.rephraseForUser({
        data: null,
        intention: IntentName.UpdateCart,
        userMessage: 'no_cart_found',
        history,
      });
    }
    const items = await intentDetectionService.extractCartItems(text, history, cartInfo.items);
    if (items.length === 0) {
      return openaiService.rephraseForUser({
        data: null,
        intention: IntentName.UpdateCart,
        userMessage: 'no_items_detected',
        history,
      });
    }

    let cart;
    try {
      cart = await cartsService.updateCartItems(cartInfo.id, items);
      if ('errors' in cart && ctx?.ajustarStock) {
        const adjusted = cartsService.adjustItemsForStock(
          items,
          'errors' in cart ? cart.errors : [],
        );
        cart = await cartsService.updateCartItems(cartInfo.id, adjusted);
      }
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        return openaiService.rephraseForUser({
          data: { error: err.message },
          intention: IntentName.UpdateCart,
          userMessage: text,
          history,
        });
      }
      throw err;
    }
    if (sessionId) {
      if ('errors' in cart) {
        sessionManager.setPendingAction(sessionId, 'adjust_stock_and_update_cart');
        sessionManager.setLastIntent(sessionId, 'update_cart_error');
      } else {
        sessionManager.clearPendingAction(sessionId);
      }
    }
    return openaiService.rephraseForUser({
      data: cart,
      intention: IntentName.UpdateCart,
      userMessage: text,
      history,
    });
  };
}
