import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { ConversationStore } from '@core/services/conversation.store';
import { AgentService } from '@core/services/agent.service';
import { MarkdownComponent } from '@shared/ui/markdown.component';
import type { Agent } from '@core/models/api.models';

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
  ],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPageComponent {
  private readonly convStore = inject(ConversationStore);
  private readonly agentSvc = inject(AgentService);

  readonly sessionId = input<string | undefined>(undefined);

  readonly agents = this.agentSvc.agents;
  readonly messages = this.convStore.messages;
  readonly streaming = this.convStore.streaming;
  readonly loading = this.convStore.loading;
  readonly activeTitle = this.convStore.activeTitle;
  readonly activeAgentId = this.convStore.activeAgentId;

  readonly draft = signal('');
  readonly canSend = computed(
    () => this.draft().trim().length > 0 && !this.streaming() && !!this.convStore.activeId(),
  );

  readonly currentAgent = computed<Agent | null>(() => {
    const id = this.activeAgentId();
    if (!id) return null;
    return this.agentSvc.byId(id) ?? null;
  });

  private readonly scrollRef = viewChild<ElementRef<HTMLDivElement>>('scrollRef');
  private readonly textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textareaRef');
  private autoScroll = true;

  constructor() {
    effect(() => {
      const id = this.sessionId();
      if (id) {
        void this.convStore.hydrate(id);
      }
    });

    effect(() => {
      this.messages();
      queueMicrotask(() => {
        if (this.autoScroll) this.scrollToBottom();
      });
    });
  }

  async newConversation(): Promise<void> {
    await this.convStore.createConversation();
    queueMicrotask(() => this.textareaRef()?.nativeElement.focus());
  }

  async send(): Promise<void> {
    if (!this.canSend()) return;
    const text = this.draft();
    if (!this.convStore.activeId()) {
      await this.convStore.createConversation();
    }
    this.draft.set('');
    await this.convStore.send(text);
  }

  async stop(): Promise<void> {
    await this.convStore.stop();
  }

  switchAgent(agentId: string): void {
    void this.convStore.createConversation(agentId);
  }

  onTextareaKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      void this.send();
    }
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
}
