import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type {
  AdminConversationDetail,
  AdminConversationSummary,
  AdminUserSummary,
} from '@core/models/api.models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  listUsers(): Promise<AdminUserSummary[]> {
    return firstValueFrom(this.http.get<AdminUserSummary[]>('/api/admin/users'));
  }

  listUserConversations(userId: number): Promise<AdminConversationSummary[]> {
    return firstValueFrom(
      this.http.get<AdminConversationSummary[]>(`/api/admin/users/${userId}/conversations`),
    );
  }

  getConversation(sessionId: string): Promise<AdminConversationDetail> {
    return firstValueFrom(
      this.http.get<AdminConversationDetail>(`/api/admin/conversations/${sessionId}`),
    );
  }
}
