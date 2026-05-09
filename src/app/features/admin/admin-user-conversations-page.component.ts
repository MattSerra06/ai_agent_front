import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminApiService } from '@core/services/admin.service';
import { LoaderComponent } from '@shared/ui/loader.component';
import type { AdminConversationSummary, AdminUserSummary } from '@core/models/api.models';
import { formatCost, formatRelativeDate, formatTokens } from './format.util';

@Component({
  selector: 'lm-admin-user-conversations-page',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule, MatTooltipModule, LoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./admin-shell.scss'],
  template: `
    <section class="lm-admin">
      <header class="lm-admin__head">
        <div>
          <a routerLink="/admin" class="lm-admin__head-back">
            <mat-icon>arrow_back</mat-icon>
            <span>Tous les utilisateurs</span>
          </a>
          <span class="lm-eyebrow">Utilisateur</span>
          <h1 class="lm-serif">{{ user()?.username ?? 'Chargement…' }}</h1>
          @if (user(); as u) {
            <p class="lm-admin__lede">
              {{ u.email }} · {{ u.role }}
              @if (u.isDefaultUser) {
                <span class="lm-admin__badge"><mat-icon>star</mat-icon>default</span>
              }
            </p>
          }
        </div>
        <div class="lm-admin__total">
          <span class="lm-eyebrow">Coût total</span>
          <span class="lm-admin__total-value">{{ totalCost() }}</span>
        </div>
      </header>

      @if (loading()) {
        <lm-loader label="Chargement des conversations…" />
      } @else if (conversations().length === 0) {
        <div class="lm-admin__empty">
          <h2 class="lm-serif">Aucune conversation.</h2>
          <p>Cet utilisateur n'a encore rien démarré.</p>
        </div>
      } @else {
        <ul class="lm-admin__list" role="list">
          @for (c of conversations(); track c.sessionId) {
            <li>
              <button type="button" class="lm-admin-row" (click)="open(c)">
                <span class="lm-admin-row__avatar" aria-hidden="true">
                  <mat-icon>chat_bubble_outline</mat-icon>
                </span>
                <span class="lm-admin-row__body">
                  <span class="lm-admin-row__title">
                    {{ c.title ?? 'Nouvelle conversation' }}
                  </span>
                  <span class="lm-admin-row__meta">
                    <span class="lm-mono">{{ c.agentName ?? '—' }}</span>
                    <span class="dot">·</span>
                    <span>{{ formatDate(c.createdAt) }}</span>
                  </span>
                </span>
                <span class="lm-admin-row__stats">
                  <span class="lm-admin-row__stat">
                    <span>Messages</span>
                    <span class="lm-mono">{{ c.messageCount }}</span>
                  </span>
                  <span class="lm-admin-row__stat">
                    <span>Tokens</span>
                    <span class="lm-mono">{{ formatTokens(c.totalTokens) }}</span>
                  </span>
                  <span class="lm-admin-row__stat">
                    <span>Coût</span>
                    <span class="lm-mono">{{ formatCost(c.totalCostUsd) }}</span>
                  </span>
                </span>
                <mat-icon class="lm-admin-row__chev" aria-hidden="true">chevron_right</mat-icon>
              </button>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class AdminUserConversationsPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);

  readonly userId = input.required<number, string | number>({ transform: numberAttribute });

  readonly user = signal<AdminUserSummary | null>(null);
  readonly conversations = signal<AdminConversationSummary[]>([]);
  readonly loading = signal(true);

  readonly totalCost = computed(() => {
    const sum = this.conversations().reduce((acc, c) => {
      const v = typeof c.totalCostUsd === 'string' ? Number(c.totalCostUsd) : c.totalCostUsd;
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
    return formatCost(sum);
  });

  readonly formatTokens = formatTokens;
  readonly formatCost = formatCost;
  readonly formatDate = formatRelativeDate;

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      // Fetch the user blob and the conv list in parallel.
      const [users, convs] = await Promise.all([
        this.api.listUsers(),
        this.api.listUserConversations(this.userId()),
      ]);
      this.user.set(users.find((u) => u.id === this.userId()) ?? null);
      this.conversations.set(convs);
    } catch {
      /* notifié par l'interceptor */
    } finally {
      this.loading.set(false);
    }
  }

  open(c: AdminConversationSummary): void {
    void this.router.navigate([
      '/admin',
      'users',
      this.userId(),
      'conversations',
      c.sessionId,
    ]);
  }
}
