import { Injectable } from '@angular/core';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  gfm: true,
  breaks: true,
});

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  render(src: string): string {
    if (!src) return '';
    const normalized = this.normalize(src);
    const html = marked.parse(normalized, { async: false }) as string;
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }

  /**
   * Corrige le markdown mal formé que le LLM peut produire :
   * - `#Titre` → `# Titre`
   * - `-item` → `- item`  (seulement un `-` ou `*` isolé, pas `**bold**`)
   * - `1.item` → `1. item`
   */
  private normalize(src: string): string {
    return src
      .split('\n')
      .map((line) => {
        const trimmed = line.trimStart();
        const indent = line.length - trimmed.length;
        const pad = ' '.repeat(indent);
        // ## Headers sans espace
        if (/^#{1,6}[^#\s]/.test(trimmed)) {
          const level = trimmed.match(/^#+/)![0];
          return pad + level + ' ' + trimmed.slice(level.length);
        }
        // - ou * list items (un seul tiret/étoile suivi d'un non-espace,
        // PAS ** ou -- qui sont du markdown valide)
        if (/^[-*](?![-*])\S/.test(trimmed)) {
          return pad + trimmed.charAt(0) + ' ' + trimmed.slice(1);
        }
        // 1.item → 1. item
        if (/^\d+\.\S/.test(trimmed)) {
          const num = trimmed.match(/^(\d+\.)/)![1];
          return pad + num + ' ' + trimmed.slice(num.length);
        }
        return line;
      })
      .join('\n');
  }
}
