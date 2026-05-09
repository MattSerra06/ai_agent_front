import { Injectable } from '@angular/core';

const STORAGE_KEY = 'lm.anon.id';

/**
 * Generates and persists a stable per-browser identifier for anonymous (logged-out) requests.
 * Sent on every API call as the {@code X-Anonymous-Session-Id} header so the back can scope
 * conversations to this visitor. Replaces the cookie-based approach because browsers refuse
 * to send {@code SameSite=Lax} cookies cross-site (front and back live on different origins
 * in production).
 */
@Injectable({ providedIn: 'root' })
export class AnonymousIdService {
  private cached: string | null = null;

  get(): string {
    if (this.cached) return this.cached;
    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = newId();
        localStorage.setItem(STORAGE_KEY, id);
      }
      this.cached = id;
      return id;
    } catch {
      // Private mode / storage disabled: fall back to a per-page-load id. Conversations
      // started in this state won't survive a refresh, but everything else still works.
      if (!this.cached) this.cached = newId();
      return this.cached;
    }
  }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
