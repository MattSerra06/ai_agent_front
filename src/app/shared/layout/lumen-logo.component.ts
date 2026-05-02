import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Logo Lumen — petit lambda + filet, vit aussi bien à 18px qu'à 80px. */
@Component({
  selector: 'lm-lumen-logo',
  standalone: true,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 32 32"
      role="img"
      aria-label="Lumen"
    >
      <rect width="32" height="32" rx="7" fill="var(--lm-bg-sunken)" />
      <path
        d="M9.5 8.5v15M9.5 23.5h13"
        stroke="var(--lm-accent)"
        stroke-width="2.4"
        stroke-linecap="round"
        fill="none"
      />
      <circle cx="22" cy="9.5" r="2.3" fill="var(--lm-bordeaux)" />
    </svg>
  `,
  styles: [`:host { display: inline-flex; line-height: 0; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LumenLogoComponent {
  readonly size = 26;
}
