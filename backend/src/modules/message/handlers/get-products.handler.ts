import { IntentDetectionService } from '../../intent-detection/intent-detection.service';
import { ProductsService } from '../../products/products.service';
import { OpenAiService } from '../../openai/openai.service';
import { SessionManagerService } from '../../session-manager/session-manager.service';
import { IntentName } from '../../intent-detection/intents';
import { ChatMessage } from '../../../utils/chat-message.type';

export function createGetProductsHandler(
  intentDetectionService: IntentDetectionService,
  productsService: ProductsService,
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
    const products = query
      ? await productsService.searchProductsSemantic(query)
      : await productsService.getAllProducts();

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
