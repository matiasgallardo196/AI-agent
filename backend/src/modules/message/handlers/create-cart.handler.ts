import { IntentDetectionService } from '../../intent-detection/intent-detection.service';
import { OpenAiService } from '../../openai/openai.service';
import { SessionManagerService } from '../../session-manager/session-manager.service';
import { IntentName } from '../../intent-detection/intents';
import { ChatMessage } from '../../../utils/chat-message.type';
import { BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import axios from 'axios';
import { BASE_URL } from 'src/config/env.loader';

export function createCreateCartHandler(
  intentDetectionService: IntentDetectionService,
  openaiService: OpenAiService,
  sessionManager: SessionManagerService,
) {
  const logger = new Logger('CreateCartHandler');
  return async function handleCreateCart(
    text: string,
    sessionId: string | undefined,
    history: ChatMessage[],
    ctx?: { ajustarStock?: boolean },
  ) {
    const items = await intentDetectionService.extractCartItems(text, history);
    logger.log(`POST ${BASE_URL}/carts`);
    let cart;
    try {
      cart = await axios
        .post(`${BASE_URL}/carts`, { items })
        .then((res) => res.data)
        .catch((err) => {
          logger.error(`Error POST ${BASE_URL}/carts: ${err.message}`);
          throw new Error('No se pudo crear el carrito');
        });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        logger.error(
          `HTTP ${err.response.status} POST ${BASE_URL}/carts - ${err.message}`,
        );
        if (err.response.status === 404 || err.response.status === 400) {
          return openaiService.rephraseForUser({
            data: { error: err.message },
            intention: IntentName.CreateCart,
            userMessage: text,
            history,
          });
        }
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
