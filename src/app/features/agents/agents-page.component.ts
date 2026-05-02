import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { AgentService } from '@core/services/agent.service';
import { ConfirmDialogComponent } from '@shared/ui/confirm-dialog.component';
import type { Agent } from '@core/models/api.models';

const MODEL_LABELS: Record<string, string> = {
  'moonshotai/kimi-k2.6': 'Kimi K2.6',
  'minimax/minimax-m2.7': 'Minimax M2.7',
};

@Component({
  selector: 'lm-agents-page',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './agents-page.component.html',
  styleUrl: './agents-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentsPageComponent {
  private readonly agentSvc = inject(AgentService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly agents = this.agentSvc.agents;
  readonly loading = this.agentSvc.loading;

  createNew(): void {
    void this.router.navigate(['/agents/new']);
  }

  edit(agent: Agent): void {
    void this.router.navigate(['/agents', agent.agentId]);
  }

  duplicate(agent: Agent): void {
    void this.router.navigate(['/agents/new'], {
      state: {
        seed: { ...agent, name: `${agent.name} (copie)` },
      },
    });
  }

  async remove(agent: Agent): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer cet agent ?',
        body: `« ${agent.name} » sera supprimé définitivement.`,
        confirm: 'Supprimer',
        danger: true,
      },
      width: '420px',
    });
    const ok = await ref.afterClosed().toPromise();
    if (ok) this.agentSvc.delete(agent.agentId);
  }

  modelLabel(modelName: string): string {
    return MODEL_LABELS[modelName] ?? modelName;
  }

  agentInitial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '·';
  }

  formatTemp(t: number): string {
    return t.toFixed(2);
  }
}
