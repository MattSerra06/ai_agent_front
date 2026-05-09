import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminApiService } from '@core/services/admin.service';
import { LoaderComponent } from '@shared/ui/loader.component';
import type { AdminUserSummary } from '@core/models/api.models';
import { formatCost, formatRelativeDate, formatTokens } from './format.util';

@Component({
  selector: 'lm-admin-users-page',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, LoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./admin-shell.scss'],
  template: `
    <section class="lm-admin">
      <header class="lm-admin__head">
        <div>
          <span class="lm-eyebrow">Atelier</span>
          <h1 class="lm-serif">Administration</h1>
          <p class="lm-admin__lede">
            Tous les utilisateurs, leurs conversations et la consommation associée.
          </p>
        </div>
        <div class="lm-admin__total">
          <span class="lm-eyebrow">Coût total cumulé</span>
          <span class="lm-admin__total-value">{{ totalCost() }}</span>
        </div>
      </header>

      @if (loading()) {
        <lm-loader label="Chargement des utilisateurs…" />
      } @else if (users().length === 0) {
        <div class="lm-admin__empty">
          <h2 class="lm-serif">Aucun utilisateur.</h2>
          <p>La table app_user est vide.</p>
        </div>
      } @else {
        <ul class="lm-admin__list" role="list">
          @for (u of users(); track u.id) {
            <li>
              <button type="button" class="lm-admin-row" (click)="open(u)">
                <span class="lm-admin-row__avatar" aria-hidden="true">
                  {{ initial(u.username) }}
                </span>
                <span class="lm-admin-row__body">
                  <span class="lm-admin-row__title">
                    {{ u.username }}
                    @if (u.isDefaultUser) {
                      <span class="lm-admin__badge" matTooltip="Default user — anonymes utilisent ses agents">
                        <mat-icon>star</mat-icon>
                        default
                      </span>
                    }
                    <span class="lm-admin__role" [class.is-admin]="u.role === 'ADMIN'">{{ u.role }}</span>
                  </span>
                  <span class="lm-admin-row__meta">
                    <span>{{ u.email }}</span>
                    <span class="dot">·</span>
                    <span>{{ formatDate(u.createdAt) }}</span>
                  </span>
                </span>
                <span class="lm-admin-row__stats">
                  <span class="lm-admin-row__stat">
                    <span>Conversations</span>
                    <span class="lm-mono">{{ u.conversationCount }}</span>
                  </span>
                  <span class="lm-admin-row__stat">
                    <span>Tokens</span>
                    <span class="lm-mono">{{ formatTokens(u.totalTokens) }}</span>
                  </span>
                  <span class="lm-admin-row__stat">
                    <span>Coût</span>
                    <span class="lm-mono">{{ formatCost(u.totalCostUsd) }}</span>
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
export class AdminUsersPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);

  readonly users = signal<AdminUserSummary[]>([]);
  readonly loading = signal(true);

  readonly totalCost = computed(() => {
    const sum = this.users().reduce((acc, u) => {
      const c = typeof u.totalCostUsd === 'string' ? Number(u.totalCostUsd) : u.totalCostUsd;
      return acc + (Number.isFinite(c) ? c : 0);
    }, 0);
    return formatCost(sum);
  });

  readonly formatTokens = formatTokens;
  readonly formatCost = formatCost;
  readonly formatDate = formatRelativeDate;

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      this.users.set(await this.api.listUsers());
    } catch {
      /* notifié par l'interceptor */
    } finally {
      this.loading.set(false);
    }
  }

  open(u: AdminUserSummary): void {
    void this.router.navigate(['/admin', 'users', u.id]);
  }

  initial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '·';
  }
}
