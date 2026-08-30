import {BRAND, FONT_IMPORT_URL, readLogoSvg} from './brand.ts';
import type {Format} from './formats.ts';
import type {MarketingPlan} from './plans.ts';
import {HOOK, PAINS, PRODUCT, CTA} from './content.ts';

export const CAROUSEL_SLIDE_COUNT = 5;

function formatPrice(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function page(format: Format, body: string): string {
  // Escalar a partir da menor dimensão, não da largura: nos formatos
  // largos (linkedin, x) a altura é o lado apertado, e escalar pela
  // largura estoura o corpo verticalmente (título cortado, rodapé some).
  // Nos formatos verticais a largura já é o menor lado, então o resultado
  // não muda.
  const scale = Math.min(format.width, format.height);
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>
  @import url('${FONT_IMPORT_URL}');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${format.width}px;
    height: ${format.height}px;
    background: hsl(${BRAND.surfaceBase});
    color: hsl(${BRAND.onSurface});
    font-family: Inter, sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: ${Math.round(scale * 0.08)}px;
    overflow: hidden;
  }
  .heading {
    font-family: Inter, sans-serif;
    font-weight: 600;
    letter-spacing: -0.03em;
    line-height: 1.05;
    font-size: ${Math.round(scale * 0.072)}px;
  }
  .accent { color: hsl(${BRAND.brand}); }
  .muted {
    color: hsl(${BRAND.onSurfaceMuted});
    font-size: ${Math.round(scale * 0.028)}px;
    line-height: 1.5;
  }
  .logo svg { width: ${Math.round(scale * 0.18)}px; height: auto; }
  .stack { display: flex; flex-direction: column; gap: ${Math.round(scale * 0.035)}px; }
  .item-title {
    font-family: Inter, sans-serif;
    font-weight: 600;
    font-size: ${Math.round(scale * 0.038)}px;
  }
  .price { font-family: Inter, sans-serif; font-weight: 600; }
  .price-value { font-size: ${Math.round(scale * 0.06)}px; }
  .rule {
    height: 1px;
    background: hsl(${BRAND.onSurfaceMuted} / 0.18);
    margin: ${Math.round(scale * 0.02)}px 0;
  }
</style>
</head>
<body>${body}</body>
</html>`;
}

function logoBlock(): string {
  return `<div class="logo">${readLogoSvg()}</div>`;
}

export function renderHook(format: Format): string {
  return page(
    format,
    `${logoBlock()}
<div>
  <h1 class="heading">${escapeHtml(HOOK.line1)}<br><span class="accent">${escapeHtml(HOOK.line2)}</span></h1>
</div>
<p class="muted">${escapeHtml(HOOK.footer)}</p>`,
  );
}

function slideList(items: ReadonlyArray<{title: string; body: string}>): string {
  return `<div class="stack">${items
    .map(
      (item) =>
        `<div><div class="item-title">${escapeHtml(item.title)}</div><div class="muted">${escapeHtml(item.body)}</div></div>`,
    )
    .join('')}</div>`;
}

function priceSlide(plans: MarketingPlan[]): string {
  return `<div>
  <h2 class="heading">Quanto custa</h2>
  <div class="rule"></div>
  <div class="stack">${plans
    .map(
      (plan) =>
        `<div class="price"><div class="item-title">${escapeHtml(plan.name)}</div>` +
        `<div class="price-value accent">R$ ${escapeHtml(formatPrice(plan.price))}<span class="muted">/mês</span></div></div>`,
    )
    .join('')}</div>
</div>`;
}

export function renderCarouselSlide(
  index: number,
  format: Format,
  plans: MarketingPlan[],
): string {
  if (index < 0 || index >= CAROUSEL_SLIDE_COUNT) {
    throw new Error(
      `Slide ${index} fora do carrossel (0..${CAROUSEL_SLIDE_COUNT - 1}).`,
    );
  }

  const slides = [
    `${logoBlock()}<div><h1 class="heading">${escapeHtml(HOOK.line1)}<br><span class="accent">${escapeHtml(HOOK.line2)}</span></h1></div><p class="muted">Arrasta para o lado</p>`,
    `${logoBlock()}<div><h2 class="heading">Onde trava</h2><div class="rule"></div>${slideList(PAINS)}</div><p class="muted"></p>`,
    `${logoBlock()}<div><h2 class="heading">O que o Trackerr resolve</h2><div class="rule"></div>${slideList(PRODUCT)}</div><p class="muted"></p>`,
    `${logoBlock()}${priceSlide(plans)}<p class="muted">Grátis até 10 ativos, sem cartão.</p>`,
    `${logoBlock()}<div><h1 class="heading">${escapeHtml(CTA.title)}<br><span class="accent">${escapeHtml(CTA.body)}</span></h1></div><p class="muted">${escapeHtml(CTA.url)}</p>`,
  ];

  return page(format, slides[index]);
}
