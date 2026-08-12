import {chromium, type Page} from '@playwright/test';
import {mkdir, writeFile, rm, readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {FORMATS, type Format, type FormatName} from './formats.ts';
import {fetchPaidPlans} from './plans.ts';
import {renderHook, renderCarouselSlide, CAROUSEL_SLIDE_COUNT} from './templates.ts';
import {buildCaptions, renderCaptionsMarkdown} from './captions.ts';
import {assertValidUtmValue} from './utm.ts';

const OUTPUT_DIR = resolve(import.meta.dirname, 'output');
const FONT_TIMEOUT_MS = 15_000;

function parseCampaign(argv: string[]): string {
  const flag = argv.find((arg) => arg.startsWith('--campaign='));
  const campaign = flag ? flag.slice('--campaign='.length) : 'validacao';
  assertValidUtmValue(campaign, 'campaign');
  return campaign;
}

// Lê largura e altura do cabeçalho IHDR do PNG (bytes 16-24), sem
// dependência nova. Confirma que a peça saiu no tamanho do formato — um
// template que estoura o body produziria imagem de outro tamanho.
async function readPngSize(path: string): Promise<Format> {
  const buffer = await readFile(path);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function shoot(
  page: Page,
  html: string,
  format: Format,
  file: string,
): Promise<void> {
  await page.setViewportSize(format);
  await page.setContent(html, {waitUntil: 'load'});

  // As fontes vêm do Google Fonts. Capturar antes de carregarem produz uma
  // peça na fonte de fallback — fora da marca e sem aviso nenhum. Expresso
  // como string porque este tsconfig não inclui a lib DOM.
  await page.waitForFunction('document.fonts.status === "loaded"', undefined, {
    timeout: FONT_TIMEOUT_MS,
  });

  const path = resolve(OUTPUT_DIR, file);
  await page.screenshot({path});

  const written = await readPngSize(path);
  if (written.width !== format.width || written.height !== format.height) {
    throw new Error(
      `${file} saiu ${written.width}x${written.height}, ` +
        `esperava ${format.width}x${format.height}.`,
    );
  }
}

async function main(): Promise<void> {
  const campaign = parseCampaign(process.argv.slice(2));

  // Tudo que pode falhar acontece antes de qualquer escrita: uma geração
  // parcial deixa PNGs velhos no diretório, indistinguíveis dos novos.
  const plans = await fetchPaidPlans();
  const captions = renderCaptionsMarkdown(buildCaptions(campaign));

  await rm(OUTPUT_DIR, {recursive: true, force: true});
  await mkdir(OUTPUT_DIR, {recursive: true});

  const browser = await chromium.launch();
  const written: string[] = [];

  try {
    const page = await browser.newPage();

    for (const name of Object.keys(FORMATS) as FormatName[]) {
      const file = `gancho-${name}.png`;
      await shoot(page, renderHook(FORMATS[name]), FORMATS[name], file);
      written.push(file);
    }

    const carouselFormat = FORMATS['instagram-feed'];
    for (let index = 0; index < CAROUSEL_SLIDE_COUNT; index += 1) {
      const file = `carrossel-${index + 1}.png`;
      await shoot(
        page,
        renderCarouselSlide(index, carouselFormat, plans),
        carouselFormat,
        file,
      );
      written.push(file);
    }
  } finally {
    await browser.close();
  }

  await writeFile(resolve(OUTPUT_DIR, 'captions.md'), captions, 'utf-8');

  const expected = Object.keys(FORMATS).length + CAROUSEL_SLIDE_COUNT;
  if (written.length !== expected) {
    throw new Error(
      `Esperava ${expected} imagens, escrevi ${written.length}.`,
    );
  }

  console.log(
    `${written.length} imagens + captions.md em marketing/output/ ` +
      `(campanha: ${campaign}, planos: ${plans
        .map((plan) => plan.name)
        .join(', ')})`,
  );
}

main().catch((error: Error) => {
  console.error(`\nFalha ao gerar as peças: ${error.message}\n`);
  process.exit(1);
});
