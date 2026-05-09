import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { ConversationStore } from '@core/services/conversation.store';
import { AgentService } from '@core/services/agent.service';
import { MarkdownComponent } from '@shared/ui/markdown.component';
import { LoaderComponent } from '@shared/ui/loader.component';
import type { Agent, ChatMessage } from '@core/models/api.models';

const MODEL_LABELS: Record<string, string> = {
  'moonshotai/kimi-k2.6': 'Kimi K2.6',
  'minimax/minimax-m2.7': 'Minimax M2.7',
};

@Component({
  selector: 'lm-chat-page',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MarkdownComponent,
    LoaderComponent,
  ],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPageComponent {
  private readonly convStore = inject(ConversationStore);
  private readonly agentSvc = inject(AgentService);
  private readonly router = inject(Router);

  readonly sessionId = input<string | undefined>(undefined);

  readonly agents = this.agentSvc.agents;
  readonly messages = this.convStore.messages;
  readonly streaming = this.convStore.streaming;
  readonly loading = this.convStore.loading;
  readonly activeTitle = this.convStore.activeTitle;
  readonly activeAgentId = this.convStore.activeAgentId;

  /**
   * Agent the next conversation will use. Pure UI state — picking one in the menu just updates this,
   * no back call. The session is only created when the user actually sends their first message.
   */
  private readonly pendingAgentId = signal<string | null>(null);

  readonly draft = signal('');

  readonly currentAgent = computed<Agent | null>(() => {
    // An active conversation is locked to its agent (the back stored it).
    const liveId = this.activeAgentId();
    if (liveId) return this.agentSvc.byId(liveId) ?? this.agentSvc.defaultAgent();
    // Otherwise reflect the user's pending pick, falling back to their default.
    const pickedId = this.pendingAgentId();
    if (pickedId) return this.agentSvc.byId(pickedId) ?? this.agentSvc.defaultAgent();
    return this.agentSvc.defaultAgent();
  });

  readonly canSend = computed(
    () => this.draft().trim().length > 0 && !this.streaming() && this.currentAgent() !== null,
  );

  private readonly scrollRef = viewChild<ElementRef<HTMLDivElement>>('scrollRef');
  private readonly textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textareaRef');
  private autoScroll = true;

  constructor() {
    effect(() => {
      const id = this.sessionId();
      if (id) {
        // Skip the (re)fetch when we're already on this session locally — typically right after
        // a lazy create-on-first-message: the store already holds the correct active state and a
        // re-hydrate here would race with the in-flight stream and wipe the optimistic AI placeholder.
        if (untracked(() => this.convStore.activeId()) === id) return;
        void this.convStore.hydrate(id);
      } else {
        this.convStore.clearActive();
      }
    });

    effect(() => {
      this.messages();
      queueMicrotask(() => {
        if (this.autoScroll) this.scrollToBottom();
      });
    });
  }

  newConversation(): void {
    this.convStore.startNewConversation();
    queueMicrotask(() => this.textareaRef()?.nativeElement.focus());
  }

  async send(): Promise<void> {
    if (!this.canSend()) return;
    const text = this.draft();
    if (!this.convStore.activeId()) {
      // Create the session lazily, on first message, with whatever agent the user picked.
      await this.convStore.createConversation(this.pendingAgentId() ?? undefined);
    }
    this.draft.set('');
    this.resetTextareaHeight();
    await this.convStore.send(text);
  }

  async stop(): Promise<void> {
    await this.convStore.stop();
  }

  /**
   * Pure UI: remember the chosen agent for the next conversation; never hits the back.
   * If we're inside an existing conversation (which is locked to its own agent), step
   * out to /chat so the next message starts a fresh session with the new agent.
   */
  switchAgent(agentId: string): void {
    this.pendingAgentId.set(agentId);
    if (this.convStore.activeId()) {
      void this.router.navigate(['/chat']);
    }
  }

  onTextareaKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      void this.send();
    }
  }

  onTextareaInput(event: Event): void {
    this.autosizeTextarea(event.target as HTMLTextAreaElement);
  }

  private autosizeTextarea(ta: HTMLTextAreaElement): void {
    ta.style.height = 'auto';
    const max = window.innerHeight * 0.3;
    ta.style.height = Math.min(ta.scrollHeight, max) + 'px';
  }

  private resetTextareaHeight(): void {
    const ta = this.textareaRef()?.nativeElement;
    if (!ta) return;
    ta.style.height = '';
  }

  onScroll(): void {
    const el = this.scrollRef()?.nativeElement;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.autoScroll = distanceFromBottom < 80;
  }

  private scrollToBottom(): void {
    const el = this.scrollRef()?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  modelLabel(modelName: string): string {
    return MODEL_LABELS[modelName] ?? modelName;
  }

  agentInitial(name: string): string {
    const cleaned = name.trim();
    return cleaned ? cleaned.charAt(0).toUpperCase() : '·';
  }

  // === Metrics helpers ===

  /** Whether the AI message has at least one metric worth showing. */
  hasMetrics(m: ChatMessage): boolean {
    return (
      m.tokensGenerated != null ||
      m.timeToFirstTokenMs != null ||
      m.totalGenerationTimeMs != null ||
      m.costUsd != null
    );
  }

  formatTokens(n: number | null | undefined): string {
    if (n == null) return '—';
    return n.toLocaleString('fr-FR');
  }

  formatCost(c: number | string | null | undefined): string {
    if (c == null) return '—';
    const v = typeof c === 'string' ? Number(c) : c;
    if (!Number.isFinite(v)) return '—';
    if (v === 0) return '$0';
    if (v < 0.0001) return '< $0.0001';
    if (v < 0.01) return '$' + v.toFixed(6);
    return '$' + v.toFixed(4);
  }

  formatMs(ms: number | null | undefined): string {
    if (ms == null) return '—';
    if (ms < 1000) return Math.round(ms) + ' ms';
    return (ms / 1000).toFixed(2) + ' s';
  }
}
