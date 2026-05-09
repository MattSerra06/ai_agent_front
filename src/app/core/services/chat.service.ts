import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import type { ChatRequest } from '@core/models/api.models';
import { AuthService } from './auth.service';
import { AnonymousIdService } from './anonymous-id.service';
import { QuotaPromptService } from './quota-prompt.service';

/** Thrown when the back returns 429 on /api/chat (free quota exhausted). */
export class QuotaExceededError extends Error {
  constructor(message = 'Quota exceeded') {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly anonId = inject(AnonymousIdService);
  private readonly quota = inject(QuotaPromptService);

  private currentAbort: AbortController | null = null;
  private readonly _streaming = signal(false);
  readonly streaming = this._streaming.asReadonly();

  async stream(req: ChatRequest, onChunk: (chunk: string) => void): Promise<string> {
    this.abortIfRunning();
    const ctrl = new AbortController();
    this.currentAbort = ctrl;
    this._streaming.set(true);

    const url = this.resolve('/api/chat');
    let full = '';
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: this.buildHeaders({
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        }),
        body: JSON.stringify(req),
        signal: ctrl.signal,
      });

      if (res.status === 429) {
        this.quota.prompt();
        throw new QuotaExceededError();
      }
      if (!res.ok || !res.body) {
        throw new Error(`Chat stream failed: ${res.status} ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sepIdx: number;
        while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
          const event = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);
          const chunk = this.parseSseEvent(event);
          if (chunk !== null) {
            full += chunk;
            onChunk(chunk);
          }
        }
      }
      if (buffer.length > 0) {
        const tail = this.parseSseEvent(buffer);
        if (tail !== null) {
          full += tail;
          onChunk(tail);
        }
      }
      return full;
    } finally {
      this._streaming.set(false);
      this.currentAbort = null;
    }
  }

  async stopGeneration(sessionId: string): Promise<void> {
    this.abortIfRunning();
    await firstValueFrom(this.http.post<void>(`/api/chat/${sessionId}/stop`, null));
  }

  private abortIfRunning(): void {
    if (this.currentAbort) {
      this.currentAbort.abort();
      this.currentAbort = null;
      this._streaming.set(false);
    }
  }

  private buildHeaders(extra: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      ...extra,
      'X-Anonymous-Session-Id': this.anonId.get(),
    };
    const token = this.auth.token();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  /**
   * Parse un bloc SSE.
   *
   * Spring WebFlux émet `data:<token>\n\n` sans espace de courtoisie après
   * `data:`. Le strip "spec SSE" (un espace optionnel après `:`) coupe alors
   * les tokens LLM qui commencent par un espace (" Gosling", " et"...) →
   * mots collés. On garde tout ce qui suit `data:` tel quel.
   */
  private parseSseEvent(raw: string): string | null {
    const lines = raw.split(/\r?\n/);
    const parts: string[] = [];
    let hasData = false;
    for (const line of lines) {
      if (line.startsWith('data:')) {
        hasData = true;
        parts.push(line.substring(5));
      }
      // Ignore les lignes non-data (event:, id:, retry:, commentaires)
    }
    if (!hasData) return null;
    return parts.join('\n');
  }

  private resolve(path: string): string {
    const base = environment.apiBaseUrl?.replace(/\/$/, '') ?? '';
    return base + path;
  }
}
