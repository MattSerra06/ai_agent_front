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
  selector: 'lm-register-page',
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

        <h1 class="lm-auth__title">Créer un compte</h1>
        <p class="lm-auth__sub">30 secondes pour des conversations illimitées.</p>

        @if (showQuotaNotice()) {
          <div class="lm-auth__notice">
            <mat-icon>lock</mat-icon>
            <span>Vous avez atteint la limite gratuite de 3 requêtes.</span>
          </div>
        }

        <form class="lm-auth__form" [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Identifiant</mat-label>
            <input
              matInput
              autocomplete="username"
              formControlName="username"
              required
            />
            @if (form.controls.username.hasError('required') && form.controls.username.touched) {
              <mat-error>Champ requis</mat-error>
            }
            @if (form.controls.username.hasError('minlength') && form.controls.username.touched) {
              <mat-error>3 caractères minimum</mat-error>
            }
            @if (form.controls.username.hasError('pattern') && form.controls.username.touched) {
              <mat-error>Lettres, chiffres, '.', '_', '-' uniquement</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input
              matInput
              type="email"
              autocomplete="email"
              formControlName="email"
              required
            />
            @if (form.controls.email.hasError('required') && form.controls.email.touched) {
              <mat-error>Champ requis</mat-error>
            }
            @if (form.controls.email.hasError('email') && form.controls.email.touched) {
              <mat-error>Email invalide</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mot de passe</mat-label>
            <input
              matInput
              type="password"
              autocomplete="new-password"
              formControlName="password"
              required
            />
            @if (form.controls.password.hasError('required') && form.controls.password.touched) {
              <mat-error>Champ requis</mat-error>
            }
            @if (form.controls.password.hasError('minlength') && form.controls.password.touched) {
              <mat-error>8 caractères minimum</mat-error>
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
              Créer mon compte
            }
          </button>
        </form>

        <div class="lm-auth__sep">ou</div>

        <p class="lm-auth__alt">
          Déjà inscrit ?
          <a [routerLink]="['/login']" [queryParams]="qp()">Se connecter</a>
        </p>

        <a routerLink="/chat" class="lm-auth__back">
          <mat-icon>arrow_back</mat-icon>
          Retour à la discussion
        </a>
      </section>
    </div>
  `,
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[A-Za-z0-9_.\-]+$/),
      ],
    ],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
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
      await this.auth.register(this.form.getRawValue());
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
    return err.error?.error ?? err.error?.message ?? err.message ?? 'Inscription impossible';
  }
  return 'Inscription impossible';
}
