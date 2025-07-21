import { Injectable } from '@nestjs/common';
import { ChatMessage } from '../../utils/chat-message.type';
import { sessionConfig } from '../../config/session.config';

interface SessionData {
  messages: ChatMessage[];
  lastIntent?: string;
  pendingAction?: string;
  cartId?: number;
  lastAccess: number;
}

@Injectable()
export class SessionManagerService {
  private sessions = new Map<string, SessionData>();

  private purgeExpiredSessions() {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastAccess > sessionConfig.ttlMs) {
        this.sessions.delete(id);
      }
    }
  }

  private getSession(sessionId: string): SessionData {
    this.purgeExpiredSessions();
    const existing = this.sessions.get(sessionId);
    if (existing) {
      existing.lastAccess = Date.now();
      return existing;
    }
    const session: SessionData = {
      messages: [],
      cartId: undefined,
      lastAccess: Date.now(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  addMessage(sessionId: string, message: ChatMessage) {
    const session = this.getSession(sessionId);
    session.messages.push(message);
    if (session.messages.length > sessionConfig.maxMessages) {
      session.messages.splice(0, session.messages.length - sessionConfig.maxMessages);
    }
    session.lastAccess = Date.now();
    this.sessions.set(sessionId, session);
  }

  getMessages(sessionId: string, lastN?: number): ChatMessage[] {
    const session = this.getSession(sessionId);
    const history = session.messages;
    if (lastN && history.length > lastN) {
      return history.slice(-lastN);
    }
    return history;
  }

  setLastIntent(sessionId: string, intent: string) {
    const session = this.getSession(sessionId);
    session.lastIntent = intent;
    session.lastAccess = Date.now();
    this.sessions.set(sessionId, session);
  }

  getLastIntent(sessionId: string): string | undefined {
    return this.getSession(sessionId).lastIntent;
  }

  setPendingAction(sessionId: string, action?: string) {
    const session = this.getSession(sessionId);
    session.pendingAction = action;
    session.lastAccess = Date.now();
    this.sessions.set(sessionId, session);
  }

  getPendingAction(sessionId: string): string | undefined {
    return this.getSession(sessionId).pendingAction;
  }

  setCartId(sessionId: string, cartId: number) {
    const session = this.getSession(sessionId);
    session.cartId = cartId;
    session.lastAccess = Date.now();
    this.sessions.set(sessionId, session);
  }

  getCartId(sessionId: string): number | undefined {
    return this.getSession(sessionId).cartId;
  }

  clearPendingAction(sessionId: string) {
    const session = this.getSession(sessionId);
    delete session.pendingAction;
    session.lastAccess = Date.now();
    this.sessions.set(sessionId, session);
  }

  clear(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}
