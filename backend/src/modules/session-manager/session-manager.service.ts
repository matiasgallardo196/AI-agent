import { Injectable } from '@nestjs/common';
import { ChatMessage } from '../../utils/chat-message.type';

@Injectable()
export class SessionManagerService {
  private sessions = new Map<string, ChatMessage[]>();

  addMessage(sessionId: string, message: ChatMessage) {
    const history = this.sessions.get(sessionId) || [];
    history.push(message);
    this.sessions.set(sessionId, history);
  }

  getMessages(sessionId: string, lastN?: number): ChatMessage[] {
    const history = this.sessions.get(sessionId) || [];
    if (lastN && history.length > lastN) {
      return history.slice(-lastN);
    }
    return history;
  }

  clear(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}
