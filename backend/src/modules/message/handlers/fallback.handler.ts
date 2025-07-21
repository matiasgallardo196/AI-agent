import { OpenAiService } from '../../openai/openai.service';
import { IntentName } from '../../intent-detection/intents';
import { ChatMessage } from '../../../utils/chat-message.type';

export function createFallbackHandler(openaiService: OpenAiService) {
  return async function handleFallback(
    text: string,
    _sessionId: string | undefined,
    history: ChatMessage[],
  ) {
    return openaiService.rephraseForUser(
      {
        data: null,
        intention: IntentName.Fallback,
        userMessage: text,
        history,
      },
      0.7,
    );
  };
}
