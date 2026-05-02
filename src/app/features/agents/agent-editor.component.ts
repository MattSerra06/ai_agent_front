import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AgentService } from '@core/services/agent.service';
import type { AgentConfig } from '@core/models/api.models';

const DEFAULT_MODELS: { label: string; value: string }[] = [
  { label: 'Kimi K2.6', value: 'moonshotai/kimi-k2.6' },
  { label: 'Minimax M2.7', value: 'minimax/minimax-m2.7' },
];

@Component({
  selector: 'lm-agent-editor',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
  ],
  templateUrl: './agent-editor.component.html',
  styleUrl: './agent-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentEditorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly agentSvc = inject(AgentService);
  private readonly snack = inject(MatSnackBar);

  readonly models = DEFAULT_MODELS;

  readonly editingId = signal<string | null>(null);
  readonly name = signal('');
  readonly modelName = signal('moonshotai/kimi-k2.6');
  readonly temperature = signal(0.7);
  readonly systemPrompt = signal('');
  readonly saving = signal(false);
  private pendingId: string | null = null;

  readonly isNew = computed(() => this.editingId() === null);
  readonly canSave = computed(
    () => this.name().trim().length > 0 && this.modelName().trim().length > 0,
  );

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      this.tryFill(id);
    } else {
      const seed = (history.state?.seed ?? null) as
        | (AgentConfig & { agentId?: string })
        | null;
      if (seed) {
        this.name.set(seed.name);
        this.modelName.set(seed.modelName);
        this.temperature.set(seed.temperature);
        this.systemPrompt.set(seed.systemPrompt);
      }
    }

    effect(() => {
      this.agentSvc.agents();
      const loading = this.agentSvc.loading();
      if (!this.pendingId) return;
      this.tryFill(this.pendingId);
      if (!loading && this.pendingId) {
        this.snack.open('Agent introuvable', 'Fermer', { duration: 3000 });
        void this.router.navigate(['/agents']);
      }
    });
  }

  private tryFill(id: string): void {
    const a = this.agentSvc.byId(id);
    if (a) {
      this.editingId.set(a.agentId);
      this.name.set(a.name);
      this.modelName.set(a.modelName);
      this.temperature.set(a.temperature);
      this.systemPrompt.set(a.systemPrompt);
      this.pendingId = null;
    } else {
      this.pendingId = id;
    }
  }

  async save(): Promise<void> {
    if (!this.canSave() || this.saving()) return;
    this.saving.set(true);
    const cfg: AgentConfig = {
      name: this.name().trim(),
      modelName: this.modelName().trim(),
      temperature: this.temperature(),
      systemPrompt: this.systemPrompt(),
    };
    try {
      const id = this.editingId();
      if (id) {
        await this.agentSvc.update(id, cfg);
        this.snack.open(`Agent « ${cfg.name} » modifié`, 'Fermer', { duration: 2500 });
      } else {
        const agent = await this.agentSvc.create(cfg);
        this.snack.open(`Agent « ${agent.name} » enregistré`, 'Fermer', { duration: 2500 });
      }
      void this.router.navigate(['/agents']);
    } catch {
      // notifié par l'interceptor
    } finally {
      this.saving.set(false);
    }
  }

  formatTemp(v: number): string {
    return v.toFixed(2);
  }
}
