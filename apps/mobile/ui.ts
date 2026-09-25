// Copyright (c) 2026 Zayier Xie. All rights reserved.

// Tiny HTML-string helpers and the inline SVG icons.

export class Raw {
  constructor(readonly s: string) {}
  toString() {
    return this.s;
  }
}

export const raw = (s: string) => new Raw(s);

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function render(v: unknown): string {
  if (v === null || v === undefined || v === false) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(render).join('');
  return esc(String(v));
}

/** Tagged template: interpolations are escaped unless wrapped in raw() or produced by html``. */
export function html(strings: TemplateStringsArray, ...vals: unknown[]): Raw {
  let out = strings[0] ?? '';
  vals.forEach((v, i) => {
    out += render(v) + (strings[i + 1] ?? '');
  });
  return new Raw(out);
}

const svg = (viewBox: string, body: string, cls = '') =>
  raw(
    `<svg class="${cls}" viewBox="${viewBox}" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`,
  );

export const icon = {
  chev: svg('0 0 8 14', '<path d="M1.5 1.5 6.5 7l-5 5.5" stroke-width="2"/>', 'chev'),
  back: svg('0 0 12 20', '<path d="M10 2 2 10l8 8" stroke-width="2.6"/>', 'back-icon'),
  close: svg('0 0 12 12', '<path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke-width="2"/>'),
  plus: svg('0 0 20 20', '<path d="M10 3.5v13M3.5 10h13" stroke-width="2.2"/>'),
  check: svg('0 0 14 14', '<path d="M3 7.4 5.8 10.2 11 4.3" stroke-width="2.2"/>'),
  clock: svg('0 0 16 16', '<circle cx="8" cy="8" r="6.3" stroke-width="1.6"/><path d="M8 4.6V8l2.2 1.4" stroke-width="1.6"/>', 'ico16'),
  down: svg('0 0 14 8', '<path d="M1.5 1.5 7 6.5l5.5-5" stroke-width="2"/>', 'down'),
  // ↑ ↓ (arrows, not chevrons: chevrons read as expand / collapse).
  up: svg('0 0 16 18', '<path d="M8 16V2.5M2.5 8 8 2.5 13.5 8" stroke-width="2.2"/>', 'mv-i'),
  dn: svg('0 0 16 18', '<path d="M8 2v13.5M2.5 10 8 15.5 13.5 10" stroke-width="2.2"/>', 'mv-i'),
  /** ⊖ remove, filled like iOS edit mode. */
  minus: raw(
    '<svg class="rm-i" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="currentColor"/><path d="M6.5 11h9" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
  ),
  warn: svg(
    '0 0 20 20',
    '<path d="M10 2.6 18.2 17H1.8L10 2.6Z" stroke-width="1.7"/><path d="M10 8v4.2" stroke-width="1.9"/><circle cx="10" cy="14.6" r=".4" stroke-width="1.6"/>',
    'warn-i',
  ),
  /** Magnifier in the venue search box. */
  search: svg('0 0 16 16', '<circle cx="7" cy="7" r="4.6" stroke-width="1.8"/><path d="M10.4 10.4 14 14" stroke-width="1.8"/>', 'search-i'),
  /** ✎ edit (the accepted paper's trip line). */
  pen: svg('0 0 16 16', '<path d="M10.8 2.7 13.3 5.2 5.6 12.9 2.5 13.5 3.1 10.4Z" stroke-width="1.6"/><path d="M9.3 4.2 11.8 6.7" stroke-width="1.6"/>', 'pen-i'),
  /** ⋯ more (nav bar). */
  more: raw(
    '<svg class="more-i" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="5.5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="18.5" cy="12" r="1.9"/></svg>',
  ),
  /** 出行设置 (a slider panel: settings, not a cog, which reads as system settings). */
  gear: svg('0 0 20 20', '<path d="M3 6h2.2M9.8 6H17M3 14h7.2M14.8 14H17" stroke-width="1.7"/><circle cx="7.5" cy="6" r="2.2" stroke-width="1.7"/><circle cx="12.5" cy="14" r="2.2" stroke-width="1.7"/>', 'ico20'),
  /** 📍 where a venue is held (the place block and sheet). */
  pin: svg('0 0 20 20', '<path d="M10 18.2s-5.8-5.5-5.8-10A5.8 5.8 0 0 1 10 2.4a5.8 5.8 0 0 1 5.8 5.8c0 4.5-5.8 10-5.8 10Z" stroke-width="1.8"/><circle cx="10" cy="8.2" r="2.2" stroke-width="1.8"/>', 'pin-i'),
  cal: svg('0 0 20 20', '<rect x="2.8" y="4" width="14.4" height="13" rx="2.4" stroke-width="1.7"/><path d="M2.8 8.2h14.4M6.6 2.4v3.2M13.4 2.4v3.2" stroke-width="1.7"/>', 'ico20'),
  today: svg('0 0 24 24', '<circle cx="12" cy="12" r="8.6" stroke-width="1.9"/><path d="M12 7.2V12l3.2 2" stroke-width="1.9"/>'),
  venues: svg(
    '0 0 24 24',
    '<path d="M3.5 9.2 12 4.2l8.5 5" stroke-width="1.9"/><path d="M6 11v6.5M10 11v6.5M14 11v6.5M18 11v6.5M3.5 20.2h17" stroke-width="1.9"/>',
  ),
  me: svg(
    '0 0 24 24',
    '<circle cx="12" cy="8.2" r="3.9" stroke-width="1.9"/><path d="M4.6 20c1.1-3.6 4-5.4 7.4-5.4s6.3 1.8 7.4 5.4" stroke-width="1.9"/>',
  ),
};
