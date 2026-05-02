import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { Agent, AgentConfig, AgentConfigResponse, AgentSummary } from '@core/models/api.models';

const STORAGE_KEY = 'lumen.agents.v1';

@Injectable({ providedIn: 'root' })
export class AgentService {
  private readonly http = inject(HttpClient);

  private readonly _agents = signal<Agent[]>(this.loadFromStorage());
  private readonly _loading = signal(false);

  readonly agents = this._agents.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly defaultAgent = computed(
    () => this._agents().find((a) => a.isDefault) ?? null,
  );

  constructor() {
    void this.list();
  }

  async list(): Promise<void> {
    try {
      this._loading.set(true);
      const res = await firstValueFrom(
        this.http.get<AgentSummary[]>('/api/agent'),
      );
      this._agents.set(
        res.map((s) => ({
          name: s.name,
          modelName: s.modelName,
          temperature: s.temperature,
          systemPrompt: s.systemPrompt,
          agentId: s.agentId,
          isDefault: s.isDefault,
          createdAt: s.createdAt,
        })),
      );
      this.persist();
    } catch {
      /* notifié par l'interceptor, on garde le cache local */
    } finally {
      this._loading.set(false);
    }
  }

  async create(config: AgentConfig): Promise<Agent> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<AgentConfigResponse>('/api/agent', config),
      );
      const agent: Agent = {
        ...config,
        agentId: res.agentId,
        createdAt: new Date().toISOString(),
      };
      this.upsert(agent);
      return agent;
    } finally {
      this._loading.set(false);
    }
  }

  async update(agentId: string, config: AgentConfig): Promise<void> {
    this._loading.set(true);
    try {
      await firstValueFrom(
        this.http.put(`/api/agent/${agentId}`, config),
      );
      this.upsert({ ...config, agentId, createdAt: new Date().toISOString() });
    } finally {
      this._loading.set(false);
    }
  }

  async delete(agentId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`/api/agent/${agentId}`),
      );
    } catch {
      /* notifié par l'interceptor */
    }
    this._agents.update((list) => list.filter((a) => a.agentId !== agentId));
    this.persist();
  }

  byId(agentId: string): Agent | undefined {
    return this._agents().find((a) => a.agentId === agentId);
  }

  private upsert(agent: Agent): void {
    this._agents.update((list) => {
      const idx = list.findIndex((a) => a.agentId === agent.agentId);
      if (idx === -1) return [agent, ...list];
      const copy = [...list];
      copy[idx] = { ...copy[idx], ...agent };
      return copy;
    });
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._agents()));
    } catch {
      /* quota plein, on ignore */
    }
  }

  private loadFromStorage(): Agent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Agent[]) : [];
    } catch {
      return [];
    }
  }
}
