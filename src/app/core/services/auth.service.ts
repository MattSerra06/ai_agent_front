import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '@core/models/api.models';

const TOKEN_KEY = 'lm.auth.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _token = signal<string | null>(this.readStoredToken());
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _bootstrapping = signal(false);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly bootstrapping = this._bootstrapping.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  /** Called once at app start: if a token exists, validate it and fetch the profile. */
  async bootstrap(): Promise<void> {
    const tk = this._token();
    if (!tk) return;
    this._bootstrapping.set(true);
    try {
      const me = await firstValueFrom(this.http.get<AuthUser>('/api/auth/me'));
      this._user.set(me);
    } catch {
      this.clearLocal();
    } finally {
      this._bootstrapping.set(false);
    }
  }

  async login(req: LoginRequest): Promise<AuthUser> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>('/api/auth/login', req),
    );
    this.applyAuth(res);
    return res.user;
  }

  async register(req: RegisterRequest): Promise<AuthUser> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>('/api/auth/register', req),
    );
    this.applyAuth(res);
    return res.user;
  }

  logout(): void {
    this.clearLocal();
  }

  private applyAuth(res: AuthResponse): void {
    this._token.set(res.token);
    this._user.set(res.user);
    try {
      localStorage.setItem(TOKEN_KEY, res.token);
    } catch {
      /* localStorage may be unavailable (SSR/private mode) */
    }
  }

  private clearLocal(): void {
    this._token.set(null);
    this._user.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }

  private readStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
