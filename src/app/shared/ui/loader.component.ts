import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Generic centered loader. Drop in anywhere a section is fetching:
 *
 *   <lm-loader />                       // bare spinner
 *   <lm-loader label="Chargement…" />   // with label
 *   <lm-loader [inline]="true" />       // smaller, sits inline
 */
@Component({
  selector: 'lm-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="lm-loader"
      [class.lm-loader--inline]="inline()"
      role="status"
      [attr.aria-label]="label() ?? 'Chargement'"
    >
      <span class="lm-loader__spinner" aria-hidden="true">
        <span class="lm-loader__filet"></span>
      </span>
      @if (label(); as l) {
        <span class="lm-loader__label">{{ l }}</span>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .lm-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        padding: 64px 24px;
        color: var(--lm-ink-2);

        &--inline {
          padding: 12px;
          flex-direction: row;
          gap: 10px;
        }

        &__spinner {
          --size: 38px;
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          border: 2px solid var(--lm-rule);
          border-top-color: var(--lm-accent, #6366f1);
          animation: lm-spin 720ms linear infinite;
          position: relative;
        }

        &--inline &__spinner {
          --size: 18px;
          border-width: 2px;
        }

        &__filet {
          position: absolute;
          inset: 50% 0 auto 50%;
          width: 18px;
          height: 1px;
          background: var(--lm-accent, #6366f1);
          transform: translate(-50%, -50%);
          opacity: 0.18;
        }

        &__label {
          font-size: 13.5px;
          color: var(--lm-ink-3);
          letter-spacing: 0.01em;
        }
      }

      @keyframes lm-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoaderComponent {
  readonly label = input<string | null>(null);
  readonly inline = input<boolean>(false);
}
