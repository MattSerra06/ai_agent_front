import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { QuotaPromptDialogComponent } from '@shared/ui/quota-prompt.dialog';

@Injectable({ providedIn: 'root' })
export class QuotaPromptService {
  private readonly dialog = inject(MatDialog);
  private opened = false;

  /** Idempotent: a single prompt at a time, no spam if multiple 429s arrive. */
  prompt(): void {
    if (this.opened) return;
    this.opened = true;
    const ref = this.dialog.open(QuotaPromptDialogComponent, {
      width: '460px',
      maxWidth: '92vw',
      panelClass: 'lm-quota-dialog-panel',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    ref.afterClosed().subscribe(() => {
      this.opened = false;
    });
  }
}
