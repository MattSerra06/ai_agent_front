import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { ConversationStore } from '@core/services/conversation.store';
import { AgentService } from '@core/services/agent.service';
import { LoaderComponent } from '@shared/ui/loader.component';
import { ConfirmDialogComponent } from '@shared/ui/confirm-dialog.component';
import type { ConversationSummary } from '@core/models/api.models';

@Component({
  selector: 'lm-conversations-list-page',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, LoaderComponent],
  templateUrl: './conversations-list-page.component.html',
  styleUrl: './conversations-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationsListPageComponent implements OnInit {
  private readonly store = inject(ConversationStore);
  private readonly agentSvc = inject(AgentService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly summaries = this.store.summaries;
  readonly loading = this.store.summariesLoading;

  /** Show the loader only when a fetch is in progress AND we don't have anything cached yet. */
  readonly showLoader = computed(
    () => this.loading() && this.summaries().length === 0,
  );

  ngOnInit(): void {
    void this.store.loadSummaries();
  }

  open(c: ConversationSummary): void {
    void this.router.navigate(['/chat', c.sessionId]);
  }

  newChat(): void {
    this.store.startNewConversation();
  }

  agentLabel(agentId: string): string {
    return this.agentSvc.byId(agentId)?.name ?? '—';
  }

  async remove(event: Event, c: ConversationSummary): Promise<void> {
    event.stopPropagation();
    event.preventDefault();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer cette conversation ?',
        body: `« ${c.title ?? 'Nouvelle conversation'} » sera supprimée définitivement.`,
        confirm: 'Supprimer',
        danger: true,
      },
      width: '420px',
    });
    const ok = await ref.afterClosed().toPromise();
    if (ok) await this.store.deleteConversation(c.sessionId);
  }

  /** Localised relative day for the card meta. */
  formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const oneDay = 86_400_000;
    const diff = now.getTime() - d.getTime();
    if (diff < oneDay && now.getDate() === d.getDate()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < oneDay * 7) {
      return d.toLocaleDateString('fr-FR', { weekday: 'long' });
    }
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
  }
}
