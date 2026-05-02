import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

import { ConversationStore } from '@core/services/conversation.store';
import { AgentService } from '@core/services/agent.service';
import { LumenLogoComponent } from './lumen-logo.component';

@Component({
  selector: 'lm-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatRippleModule,
    LumenLogoComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent implements OnInit {
  private readonly convStore = inject(ConversationStore);
  private readonly agentSvc = inject(AgentService);

  readonly summaries = this.convStore.summaries;
  readonly activeId = this.convStore.activeId;
  readonly agents = this.agentSvc.agents;

  readonly recent = computed(() =>
    [...this.summaries()]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 12),
  );

  ngOnInit(): void {
    void this.convStore.loadSummaries();
  }

  async newChat(): Promise<void> {
    await this.convStore.createConversation();
  }

  selectConversation(id: string): void {
    this.convStore.setActive(id);
  }

  removeConversation(event: Event, id: string): void {
    event.stopPropagation();
    event.preventDefault();
    void this.convStore.deleteConversation(id);
  }

  agentLabel(agentId: string): string {
    return this.agentSvc.byId(agentId)?.name ?? '—';
  }
}
