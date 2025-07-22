import { IntentDetectionService } from '../../intent-detection/intent-detection.service';
import { OpenAiService } from '../../openai/openai.service';
import { IntentName } from '../../intent-detection/intents';
import { ChatMessage } from '../../../utils/chat-message.type';
import { SessionManagerService } from '../../session-manager/session-manager.service';
import { BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import axios from 'axios';
import { BASE_URL } from 'src/config/env.loader';

export function createUpdateCartHandler(
  intentDetectionService: IntentDetectionService,
  openaiService: OpenAiService,
  sessionManager: SessionManagerService,
) {
  const logger = new Logger('UpdateCartHandler');
  return async function handleUpdateCart(
    text: string,
    sessionId: string | undefined,
    history: ChatMessage[],
    ctx?: { ajustarStock?: boolean },
  ) {
    const cartInfo = await intentDetectionService.extractCartInfo(text, history);
    logger.debug(`Cart info extracted: ${JSON.stringify(cartInfo)}`);
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
    logger.log(`PATCH ${BASE_URL}/carts/${cartInfo.id}`);
    let cart;
    try {
      cart = await axios
        .patch(`${BASE_URL}/carts/${cartInfo.id}`, { items })
        .then((res) => res.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        logger.error(
          `HTTP ${err.response.status} PATCH ${BASE_URL}/carts/${cartInfo.id} - ${err.message}`,
        );
        if (err.response.status === 404 || err.response.status === 400) {
          return openaiService.rephraseForUser({
            data: { error: err.message },
            intention: IntentName.UpdateCart,
            userMessage: text,
            history,
          });
        }
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
