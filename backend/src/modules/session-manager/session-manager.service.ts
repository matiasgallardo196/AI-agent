import { Injectable } from '@nestjs/common';
import { ChatMessage } from '../../utils/chat-message.type';

interface SessionData {
  messages: ChatMessage[];
  lastIntent?: string;
  pendingAction?: string;
  cartId?: number;
}

@Injectable()
export class SessionManagerService {
  private sessions = new Map<string, SessionData>();

  private getSession(sessionId: string): SessionData {
    return this.sessions.get(sessionId) || { messages: [], cartId: undefined };
  }

  addMessage(sessionId: string, message: ChatMessage) {
    const session = this.getSession(sessionId);
    session.messages.push(message);
    this.sessions.set(sessionId, session);
  }

  getMessages(sessionId: string, lastN?: number): ChatMessage[] {
    const history = this.sessions.get(sessionId)?.messages || [];
    if (lastN && history.length > lastN) {
      return history.slice(-lastN);
    }
    return history;
  }

  setLastIntent(sessionId: string, intent: string) {
    const session = this.getSession(sessionId);
    session.lastIntent = intent;
    this.sessions.set(sessionId, session);
  }

  getLastIntent(sessionId: string): string | undefined {
    return this.sessions.get(sessionId)?.lastIntent;
  }

  setPendingAction(sessionId: string, action?: string) {
    const session = this.getSession(sessionId);
    session.pendingAction = action;
    this.sessions.set(sessionId, session);
  }

  getPendingAction(sessionId: string): string | undefined {
    return this.sessions.get(sessionId)?.pendingAction;
  }

  setCartId(sessionId: string, cartId: number) {
    const session = this.getSession(sessionId);
    session.cartId = cartId;
    this.sessions.set(sessionId, session);
  }

  getCartId(sessionId: string): number | undefined {
    return this.sessions.get(sessionId)?.cartId;
  }

  clearPendingAction(sessionId: string) {
    const session = this.getSession(sessionId);
    delete session.pendingAction;
    this.sessions.set(sessionId, session);
  }

  clear(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}
