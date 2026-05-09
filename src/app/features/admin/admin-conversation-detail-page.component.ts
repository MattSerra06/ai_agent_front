import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { AdminApiService } from '@core/services/admin.service';
import { LoaderComponent } from '@shared/ui/loader.component';
import { MarkdownComponent } from '@shared/ui/markdown.component';
import type { AdminConversationDetail } from '@core/models/api.models';
import { formatCost, formatMs, formatRelativeDate, formatTokens } from './format.util';

@Component({
  selector: 'lm-admin-conversation-detail-page',
  standalone: true,
  imports: [RouterLink, MatIconModule, LoaderComponent, MarkdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./admin-shell.scss'],
  template: `
    <section class="lm-admin">
      <header class="lm-admin__head">
        <div>
          <a [routerLink]="['/admin', 'users', userId()]" class="lm-admin__head-back">
            <mat-icon>arrow_back</mat-icon>
            <span>Conversations de l'utilisateur</span>
          </a>
          <span class="lm-eyebrow">Conversation</span>
          <h1 class="lm-serif">{{ detail()?.title ?? 'Nouvelle conversation' }}</h1>
          @if (detail(); as d) {
            <p class="lm-admin__lede">
              <span class="lm-mono">{{ d.agentName ?? '—' }}</span>
              · {{ d.ownerUsername ?? '—' }}
              · {{ formatDate(d.createdAt) }}
            </p>
          }
        </div>
      </header>

      @if (loading()) {
        <lm-loader label="Chargement de la conversation…" />
      } @else if (detail(); as d) {
        <div class="lm-admin-detail__summary">
          <div class="lm-admin-stat">
            <span class="lm-admin-stat__label">Messages</span>
            <span class="lm-admin-stat__value">{{ d.messageCount }}</span>
          </div>
          <div class="lm-admin-stat">
            <span class="lm-admin-stat__label">Tokens cumulés</span>
            <span class="lm-admin-stat__value">{{ formatTokens(d.totalTokens) }}</span>
          </div>
          <div class="lm-admin-stat">
            <span class="lm-admin-stat__label">Coût total</span>
            <span class="lm-admin-stat__value">{{ formatCost(d.totalCostUsd) }}</span>
          </div>
        </div>

        <div class="lm-admin-msgs">
          @for (m of d.messages; track m.id) {
            <article
              class="lm-admin-msg"
              [class.lm-admin-msg--user]="m.role === 'user'"
              [class.lm-admin-msg--assistant]="m.role === 'assistant'"
            >
              <header class="lm-admin-msg__head">
                <span class="lm-admin-msg__role">{{ m.role }}</span>
                <span>{{ formatDate(m.createdAt ?? null) }}</span>
              </header>

              @if (m.role === 'assistant') {
                <lm-markdown [source]="m.content" />
              } @else {
                <div class="lm-admin-msg__content">{{ m.content }}</div>
              }

              @if (m.role === 'assistant' && hasMetrics(m)) {
                <div class="lm-admin-msg__metrics">
                  <span class="lm-admin-msg__metric">
                    <mat-icon>token</mat-icon>
                    <span>Tokens</span>
                    <span class="lm-mono">{{ formatTokens(m.tokensGenerated) }}</span>
                  </span>
                  <span class="lm-admin-msg__metric">
                    <mat-icon>payments</mat-icon>
                    <span>Coût</span>
                    <span class="lm-mono">{{ formatCost(m.costUsd) }}</span>
                  </span>
                  <span class="lm-admin-msg__metric">
                    <mat-icon>bolt</mat-icon>
                    <span>1<sup>er</sup> token</span>
                    <span class="lm-mono">{{ formatMs(m.timeToFirstTokenMs) }}</span>
                  </span>
                  <span class="lm-admin-msg__metric">
                    <mat-icon>timer</mat-icon>
                    <span>Total</span>
                    <span class="lm-mono">{{ formatMs(m.totalGenerationTimeMs) }}</span>
                  </span>
                </div>
              }
            </article>
          }
        </div>
      } @else {
        <div class="lm-admin__empty">
          <h2 class="lm-serif">Conversation introuvable.</h2>
        </div>
      }
    </section>
  `,
})
export class AdminConversationDetailPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly userId = input.required<number, string | number>({ transform: numberAttribute });
  readonly sessionId = input.required<string>();

  readonly detail = signal<AdminConversationDetail | null>(null);
  readonly loading = signal(true);

  readonly formatTokens = formatTokens;
  readonly formatCost = formatCost;
  readonly formatMs = formatMs;
  readonly formatDate = formatRelativeDate;

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      this.detail.set(await this.api.getConversation(this.sessionId()));
    } catch {
      /* notifié par l'interceptor */
    } finally {
      this.loading.set(false);
    }
  }

  hasMetrics(m: { tokensGenerated?: number | null; timeToFirstTokenMs?: number | null; totalGenerationTimeMs?: number | null; costUsd?: number | string | null }): boolean {
    return (
      m.tokensGenerated != null ||
      m.timeToFirstTokenMs != null ||
      m.totalGenerationTimeMs != null ||
      m.costUsd != null
    );
  }
}
