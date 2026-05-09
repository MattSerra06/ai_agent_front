import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

export type QuotaPromptResult = 'login' | 'register' | 'cancel';

@Component({
  selector: 'lm-quota-prompt-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lm-quota-dlg">
      <div class="lm-quota-dlg__icon" aria-hidden="true">
        <mat-icon>lock</mat-icon>
      </div>

      <h2 mat-dialog-title class="lm-serif">Vous avez atteint la limite gratuite</h2>

      <mat-dialog-content>
        <p>
          Les <strong>3 requêtes</strong> offertes pour découvrir Lumen sont utilisées.
          Créez un compte ou connectez-vous pour continuer la conversation.
        </p>
        <p class="lm-quota-dlg__sub">
          C'est gratuit et ça prend 30 secondes.
        </p>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancel()">Plus tard</button>
        <button mat-stroked-button (click)="register()">Créer un compte</button>
        <button mat-flat-button color="primary" (click)="login()">
          <mat-icon>login</mat-icon>
          Se connecter
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .lm-quota-dlg {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 4px 4px 0;
        max-width: 460px;

        &__icon {
          align-self: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--lm-accent-soft, rgba(99, 102, 241, 0.12));
          color: var(--lm-accent, #6366f1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 8px;

          mat-icon {
            font-size: 28px;
            width: 28px;
            height: 28px;
          }
        }

        h2 {
          margin: 4px 0 0;
          text-align: center;
          font-size: 20px;
        }

        p {
          margin: 0;
          color: var(--lm-ink-2, #444);
          font-size: 14px;
          line-height: 1.5;
        }

        &__sub {
          color: var(--lm-ink-3, #888) !important;
          font-size: 12.5px !important;
        }

        mat-dialog-actions {
          gap: 8px;
          padding-bottom: 8px;
        }
      }
    `,
  ],
})
export class QuotaPromptDialogComponent {
  private readonly ref = inject(MatDialogRef<QuotaPromptDialogComponent, QuotaPromptResult>);
  private readonly router = inject(Router);

  cancel(): void {
    this.ref.close('cancel');
  }

  login(): void {
    this.ref.close('login');
    void this.router.navigate(['/login'], { queryParams: { reason: 'quota' } });
  }

  register(): void {
    this.ref.close('register');
    void this.router.navigate(['/register'], { queryParams: { reason: 'quota' } });
  }
}
