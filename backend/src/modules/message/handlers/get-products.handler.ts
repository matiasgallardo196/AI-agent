import { IntentDetectionService } from '../../intent-detection/intent-detection.service';
import { OpenAiService } from '../../openai/openai.service';
import { SessionManagerService } from '../../session-manager/session-manager.service';
import { IntentName } from '../../intent-detection/intents';
import { ChatMessage } from '../../../utils/chat-message.type';
import { BASE_URL } from 'src/config/env.loader';
import axios from 'axios';

export function createGetProductsHandler(
  intentDetectionService: IntentDetectionService,
  openaiService: OpenAiService,
  sessionManager: SessionManagerService,
) {
  return async function handleGetProducts(
    text: string,
    sessionId: string | undefined,
    history: ChatMessage[],
    ctx?: { query?: string | null },
  ) {
    const query = ctx?.query ?? (await intentDetectionService.extractQuery(text, history));
    const products = await axios
      .get(`${BASE_URL}/products`, {
        params: query ? { q: query } : {},
      })
      .then((res) => res.data)
      .catch((err) => {
        console.error('❌ Error al obtener productos:', err.message);
        throw new Error('No se pudieron obtener los productos');
      });

    if (sessionId) {
      const productSummary = products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
      }));

      const naturalContent = productSummary
        .map((p, i) => `${i + 1}. ${p.name} (ID: ${p.id}) - ${p.description}`)
        .join('\n');

      sessionManager.addMessage(sessionId, {
        role: 'assistant',
        content: `Aquí tienes una lista de productos disponibles:\n\n${naturalContent}`,
      });
    }

    return openaiService.rephraseForUser({
      data: products,
      intention: IntentName.GetProducts,
      userMessage: text,
      history,
    });
  };
}
