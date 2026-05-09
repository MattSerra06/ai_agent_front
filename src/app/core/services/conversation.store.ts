import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ChatService, QuotaExceededError } from './chat.service';
import { ConversationService } from './conversation.service';
import type {
  ChatMessage,
  ConversationSummary,
  ServerMessage,
} from '@core/models/api.models';

const uid = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
};

@Injectable({ providedIn: 'root' })
export class ConversationStore {
  private readonly chat = inject(ChatService);
  private readonly convSvc = inject(ConversationService);
  private readonly router = inject(Router);

  private readonly _summaries = signal<ConversationSummary[]>([]);
  private readonly _activeId = signal<string | null>(null);
  private readonly _messages = signal<ChatMessage[]>([]);
  private readonly _activeTitle = signal<string | null>(null);
  private readonly _activeAgentId = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _summariesLoading = signal(false);

  readonly summaries = this._summaries.asReadonly();
  readonly activeId = this._activeId.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly activeTitle = this._activeTitle.asReadonly();
  readonly activeAgentId = this._activeAgentId.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly summariesLoading = this._summariesLoading.asReadonly();
  readonly streaming = this.chat.streaming;

  readonly active = computed(() => {
    const id = this._activeId();
    return id ? (this._summaries().find((c) => c.sessionId === id) ?? null) : null;
  });

  async loadSummaries(): Promise<void> {
    this._summariesLoading.set(true);
    try {
      const list = await this.convSvc.list();
      const sorted = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      this._summaries.set(sorted);
    } catch {
      /* error handled by interceptor */
    } finally {
      this._summariesLoading.set(false);
    }
  }

  async createConversation(agentId?: string): Promise<ConversationSummary> {
    const summary = await this.convSvc.create(agentId ? { agentId } : undefined);
    this._summaries.update((list) => [summary, ...list]);
    this._activeId.set(summary.sessionId);
    this._activeTitle.set(summary.title);
    this._activeAgentId.set(summary.agentId);
    this._messages.set([]);
    void this.router.navigate(['/chat', summary.sessionId]);
    return summary;
  }

  /**
   * Start a fresh conversation in the UI without persisting anything yet. The session is
   * created on the back only when the user actually sends their first message — this keeps
   * the DB clean of empty sessions when users click "new chat" repeatedly.
   */
  startNewConversation(): void {
    this.clearActive();
    void this.router.navigate(['/chat']);
  }

  async hydrate(sessionId: string): Promise<boolean> {
    this._loading.set(true);
    this._activeId.set(sessionId);
    try {
      const detail = await this.convSvc.get(sessionId);
      this._activeTitle.set(detail.title);
      this._activeAgentId.set(detail.agentId);
      this._messages.set(serverToChat(detail.messages));
      this._loading.set(false);
      return true;
    } catch {
      this._loading.set(false);
      this._messages.set([]);
      return false;
    }
  }

  setActive(sessionId: string): void {
    void this.router.navigate(['/chat', sessionId]);
  }

  clearActive(): void {
    this._activeId.set(null);
    this._activeTitle.set(null);
    this._activeAgentId.set(null);
    this._messages.set([]);
  }

  async deleteConversation(sessionId: string): Promise<void> {
    try {
      await this.convSvc.delete(sessionId);
    } catch {
      /* error displayed by interceptor */
    }
    this._summaries.update((list) => list.filter((c) => c.sessionId !== sessionId));
    if (this._activeId() === sessionId) {
      const next = this._summaries()[0]?.sessionId ?? null;
      this._activeId.set(next);
      if (next) {
        void this.router.navigate(['/chat', next]);
      } else {
        this._messages.set([]);
        this._activeTitle.set(null);
        this._activeAgentId.set(null);
        void this.router.navigate(['/chat']);
      }
    }
  }

  async send(text: string): Promise<void> {
    const sessionId = this._activeId();
    if (!sessionId || !text.trim()) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text.trim(),
      ts: Date.now(),
    };
    const aiId = uid();
    const aiMsg: ChatMessage = {
      id: aiId,
      role: 'assistant',
      content: '',
      streaming: true,
      ts: Date.now(),
    };
    const wasEmpty = this._messages().length === 0;
    this._messages.update((list) => [...list, userMsg, aiMsg]);

    try {
      await this.chat.stream(
        { sessionId, message: text.trim() },
        (chunk) => this.appendChunk(aiId, chunk),
      );
      this.markFinished(aiId);
      if (wasEmpty) {
        this.refreshTitle(sessionId);
      }
      this.scheduleMetricsRefresh(sessionId, aiId);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        // Pop-up handled centrally; just remove the placeholder + the user msg so the
        // UI doesn't show a half-baked exchange.
        this._messages.update((list) =>
          list.filter((m) => m.id !== aiId && m.id !== userMsg.id),
        );
      } else if ((err as DOMException).name !== 'AbortError') {
        this.appendChunk(
          aiId,
          '\n\n_⚠ La réponse a été interrompue (erreur réseau)._',
        );
        this.markFinished(aiId);
      } else {
        this._messages.update((list) =>
          list.filter((m) => m.id !== aiId),
        );
      }
    }
  }

  async stop(): Promise<void> {
    const sessionId = this._activeId();
    if (!sessionId) return;
    try {
      await this.chat.stopGeneration(sessionId);
    } catch {
      /* ignoré */
    }
    this._messages.update((list) =>
      list.filter((m) => !m.streaming),
    );
  }

  async refresh(sessionId: string): Promise<void> {
    if (sessionId === this._activeId()) {
      await this.hydrate(sessionId);
    }
  }

  private appendChunk(msgId: string, chunk: string): void {
    this._messages.update((list) =>
      list.map((m) =>
        m.id === msgId ? { ...m, content: m.content + chunk } : m,
      ),
    );
  }

  private markFinished(msgId: string): void {
    this._messages.update((list) =>
      list.map((m) => (m.id === msgId ? { ...m, streaming: false } : m)),
    );
  }

  /**
   * The back persists assistant metrics asynchronously after the stream ends (~800ms for the
   * OpenRouter Generation API roundtrip). Wait, refetch the conversation, and merge in the
   * metrics on the local message we just streamed -- without disturbing other in-flight work.
   */
  private scheduleMetricsRefresh(sessionId: string, aiMsgId: string): void {
    setTimeout(() => {
      if (this._activeId() !== sessionId) return;
      void this.mergeLastAssistantMetrics(sessionId, aiMsgId);
    }, 1500);
  }

  private async mergeLastAssistantMetrics(sessionId: string, aiMsgId: string): Promise<void> {
    try {
      const detail = await this.convSvc.get(sessionId);
      const lastAssistant = [...detail.messages].reverse().find((m) => m.role === 'assistant');
      if (!lastAssistant) return;
      this._messages.update((list) =>
        list.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                tokensGenerated: lastAssistant.tokensGenerated ?? null,
                timeToFirstTokenMs: lastAssistant.timeToFirstTokenMs ?? null,
                totalGenerationTimeMs: lastAssistant.totalGenerationTimeMs ?? null,
                costUsd: lastAssistant.costUsd ?? null,
              }
            : m,
        ),
      );
    } catch {
      // Metrics will surface on next page load; nothing else to do.
    }
  }

  private async refreshTitle(sessionId: string): Promise<void> {
    try {
      const detail = await this.convSvc.get(sessionId);
      this._activeTitle.set(detail.title);
      this._summaries.update((list) =>
        list.map((c) =>
          c.sessionId === sessionId ? { ...c, title: detail.title } : c,
        ),
      );
    } catch {
      /* ignore */
    }
  }
}

function serverToChat(msgs: ServerMessage[]): ChatMessage[] {
  return msgs.map((m) => ({
    id: uid(),
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
    streaming: false,
    ts: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
    tokensGenerated: m.tokensGenerated ?? null,
    timeToFirstTokenMs: m.timeToFirstTokenMs ?? null,
    totalGenerationTimeMs: m.totalGenerationTimeMs ?? null,
    costUsd: m.costUsd ?? null,
  }));
}
