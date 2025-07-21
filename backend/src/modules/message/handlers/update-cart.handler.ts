import { IntentDetectionService } from '../../intent-detection/intent-detection.service';
import { CartsService } from '../../carts/carts.service';
import { OpenAiService } from '../../openai/openai.service';
import { IntentName } from '../../intent-detection/intents';
import { ChatMessage } from '../../../utils/chat-message.type';

export function createUpdateCartHandler(
  intentDetectionService: IntentDetectionService,
  cartsService: CartsService,
  openaiService: OpenAiService,
) {
  return async function handleUpdateCart(
    text: string,
    sessionId: string | undefined,
    history: ChatMessage[],
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
    console.log('Text for update cart:', text);
    console.log('cartId:', cartInfo.id, 'items:', items);
    const cart = await cartsService.updateCartItems(cartInfo.id, items);
    return openaiService.rephraseForUser({
      data: cart,
      intention: IntentName.UpdateCart,
      userMessage: text,
      history,
    });
  };
}
