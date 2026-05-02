import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type {
  ConversationDetail,
  ConversationSummary,
  CreateConversationRequest,
} from '@core/models/api.models';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);

  list(): Promise<ConversationSummary[]> {
    return firstValueFrom(
      this.http.get<ConversationSummary[]>('/api/conversation'),
    );
  }

  get(sessionId: string): Promise<ConversationDetail> {
    return firstValueFrom(
      this.http.get<ConversationDetail>(`/api/conversation/${sessionId}`),
    );
  }

  create(req?: CreateConversationRequest): Promise<ConversationSummary> {
    return firstValueFrom(
      this.http.post<ConversationSummary>('/api/conversation', req ?? {}),
    );
  }

  delete(sessionId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`/api/conversation/${sessionId}`),
    );
  }
}
