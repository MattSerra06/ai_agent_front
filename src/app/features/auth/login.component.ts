import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '@core/services/auth.service';
import { LumenLogoComponent } from '@shared/layout/lumen-logo.component';

@Component({
  selector: 'lm-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    LumenLogoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./auth-shell.scss'],
  template: `
    <div class="lm-auth">
      <section class="lm-auth__card">
        <div class="lm-auth__brand">
          <lm-lumen-logo />
          <span>Lumen</span>
        </div>

        <h1 class="lm-auth__title">Bon retour</h1>
        <p class="lm-auth__sub">Connectez-vous pour continuer la conversation.</p>

        @if (showQuotaNotice()) {
          <div class="lm-auth__notice">
            <mat-icon>lock</mat-icon>
            <span>Connectez-vous pour débloquer les requêtes illimitées.</span>
          </div>
        }

        <form class="lm-auth__form" [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Identifiant ou email</mat-label>
            <input
              matInput
              autocomplete="username"
              formControlName="usernameOrEmail"
              required
            />
            @if (form.controls.usernameOrEmail.hasError('required') && form.controls.usernameOrEmail.touched) {
              <mat-error>Champ requis</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mot de passe</mat-label>
            <input
              matInput
              type="password"
              autocomplete="current-password"
              formControlName="password"
              required
            />
            @if (form.controls.password.hasError('required') && form.controls.password.touched) {
              <mat-error>Champ requis</mat-error>
            }
          </mat-form-field>

          @if (errorMessage()) {
            <div class="lm-auth__error">{{ errorMessage() }}</div>
          }

          <button
            mat-flat-button
            color="primary"
            type="submit"
            class="lm-auth__submit"
            [disabled]="busy() || form.invalid"
          >
            @if (busy()) {
              <mat-spinner diameter="18"></mat-spinner>
            } @else {
              Se connecter
            }
          </button>
        </form>

        <div class="lm-auth__sep">ou</div>

        <p class="lm-auth__alt">
          Pas encore de compte ?
          <a [routerLink]="['/register']" [queryParams]="qp()">Créer un compte</a>
        </p>

        <a routerLink="/chat" class="lm-auth__back">
          <mat-icon>arrow_back</mat-icon>
          Retour à la discussion
        </a>
      </section>
    </div>
  `,
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    usernameOrEmail: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  readonly busy = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showQuotaNotice = computed(
    () => this.route.snapshot.queryParamMap.get('reason') === 'quota',
  );

  readonly qp = computed(() => {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    return reason ? { reason } : {};
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.errorMessage.set(null);
    try {
      await this.auth.login(this.form.getRawValue());
      const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '/chat';
      void this.router.navigateByUrl(redirect);
    } catch (err) {
      this.errorMessage.set(extractErr(err));
    } finally {
      this.busy.set(false);
    }
  }
}

function extractErr(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    return err.error?.error ?? err.error?.message ?? err.message ?? 'Identifiants invalides';
  }
  return 'Identifiants invalides';
}
