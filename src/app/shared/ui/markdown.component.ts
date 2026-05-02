import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MarkdownService } from '@core/services/markdown.service';

@Component({
  selector: 'lm-markdown',
  standalone: true,
  template: `<div class="lm-md" [class.lm-streaming-caret]="streaming()" [innerHTML]="html()"></div>`,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .lm-md {
        color: var(--lm-ink);
        font-size: 16px;
        line-height: 1.65;
      }

      .lm-md > *:first-child {
        margin-top: 0;
      }
      .lm-md > *:last-child {
        margin-bottom: 0;
      }

      .lm-md p {
        margin: 0.6em 0;
      }

      .lm-md h1,
      .lm-md h2,
      .lm-md h3 {
        font-family: var(--font-serif);
        font-weight: 500;
        letter-spacing: -0.01em;
        margin: 1.4em 0 0.5em;
        color: var(--lm-ink);
      }
      .lm-md h1 {
        font-size: 1.7em;
      }
      .lm-md h2 {
        font-size: 1.35em;
      }
      .lm-md h3 {
        font-size: 1.12em;
        font-weight: 600;
      }

      .lm-md strong {
        font-weight: 600;
        color: var(--lm-ink);
      }
      .lm-md em {
        font-style: italic;
      }

      .lm-md code {
        font-family: var(--font-mono);
        font-size: 0.88em;
        background: var(--lm-bg-sunken);
        border: 1px solid var(--lm-rule);
        padding: 1px 5px;
        border-radius: var(--lm-r-xs);
      }

      .lm-md pre {
        font-family: var(--font-mono);
        background: var(--lm-bg-sunken);
        border: 1px solid var(--lm-rule);
        border-radius: var(--lm-r-md);
        padding: 14px 16px;
        overflow-x: auto;
        font-size: 13px;
        line-height: 1.6;
        margin: 1em 0;
      }
      .lm-md pre code {
        background: transparent;
        border: 0;
        padding: 0;
      }

      .lm-md ul {
        list-style-type: disc;
        padding-left: 1.6em;
        margin: 0.6em 0;
      }
      .lm-md ol {
        list-style-type: decimal;
        padding-left: 1.6em;
        margin: 0.6em 0;
      }
      .lm-md li {
        margin: 0.3em 0;
      }
      .lm-md li::marker {
        color: var(--lm-ink-3);
      }

      .lm-md blockquote {
        border-left: 2px solid var(--lm-accent);
        padding: 0.1em 0 0.1em 1em;
        margin: 1em 0;
        color: var(--lm-ink-2);
        font-style: italic;
        font-family: var(--font-serif);
      }

      .lm-md a {
        color: var(--lm-accent);
        text-decoration: underline;
        text-underline-offset: 3px;
        text-decoration-thickness: 1px;
      }

      .lm-md hr {
        border: 0;
        border-top: 1px solid var(--lm-rule);
        margin: 1.4em 0;
      }

      .lm-md table {
        border-collapse: collapse;
        margin: 1em 0;
        font-size: 0.93em;
      }
      .lm-md th,
      .lm-md td {
        border: 1px solid var(--lm-rule);
        padding: 6px 10px;
        text-align: left;
      }
      .lm-md th {
        background: var(--lm-bg-sunken);
        font-weight: 600;
      }

      .lm-streaming-caret::after {
        content: '\\25CD';
        display: inline-block;
        margin-left: 2px;
        color: var(--lm-accent);
        animation: lm-blink 1.05s steps(1) infinite;
        font-weight: 300;
        vertical-align: -0.05em;
      }

      @keyframes lm-blink {
        50% {
          opacity: 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MarkdownComponent {
  readonly source = input.required<string>();
  readonly streaming = input<boolean>(false);

  private readonly md = inject(MarkdownService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly html = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.md.render(this.source())),
  );
}
