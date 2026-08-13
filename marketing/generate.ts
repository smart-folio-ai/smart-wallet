import {chromium, type Page} from '@playwright/test';
import {mkdir, writeFile, rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {FORMATS, type Format, type FormatName} from './formats.ts';
import {fetchPaidPlans} from './plans.ts';
import {renderHook, renderCarouselSlide, CAROUSEL_SLIDE_COUNT} from './templates.ts';
import {buildCaptions, renderCaptionsMarkdown} from './captions.ts';
import {assertValidUtmValue} from './utm.ts';

const OUTPUT_DIR = resolve(import.meta.dirname, 'output');
const FONT_TIMEOUT_MS = 15_000;

type Shot = {file: string; buffer: Buffer};

function parseCampaign(argv: string[]): string {
  const flag = argv.find((arg) => arg.startsWith('--campaign='));
  const campaign = flag ? flag.slice('--campaign='.length) : 'validacao';
  assertValidUtmValue(campaign, 'campaign');
  return campaign;
}

// Lê largura e altura do cabeçalho IHDR do PNG (bytes 16-24), sem
// dependência nova. Confirma que a peça saiu no tamanho do formato — um
// template que estoura o body produziria imagem de outro tamanho.
function readPngSize(buffer: Buffer): Format {
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
): Promise<Shot> {
  await page.setViewportSize(format);
  await page.setContent(html, {waitUntil: 'load'});

  // As fontes vêm do Google Fonts. Capturar antes de carregarem produz uma
  // peça na fonte de fallback — fora da marca e sem aviso nenhum. Expresso
  // como string porque este tsconfig não inclui a lib DOM.
  await page.waitForFunction('document.fonts.status === "loaded"', undefined, {
    timeout: FONT_TIMEOUT_MS,
  });

  // Sem `path`: o screenshot fica só em memória. Escrever em disco aqui
  // tornaria a checagem de tamanho abaixo tarde demais para evitar output
  // parcial — o arquivo já estaria no diretório antes de qualquer chance
  // de dar throw.
  const buffer = await page.screenshot();

  const written = readPngSize(buffer);
  if (written.width !== format.width || written.height !== format.height) {
    throw new Error(
      `${file} saiu ${written.width}x${written.height}, ` +
        `esperava ${format.width}x${format.height}.`,
    );
  }

  return {file, buffer};
}

async function main(): Promise<void> {
  const campaign = parseCampaign(process.argv.slice(2));

  // Tudo que pode falhar — busca de planos, campanha inválida, launch do
  // Chromium, cada screenshot, cada checagem de dimensão — acontece antes
  // de qualquer escrita em marketing/output/. Os PNGs ficam em memória
  // (buffers) até o fim; só depois que todos os nove saíram certos é que
  // o diretório é apagado e recriado. Isso garante que uma falha a meio
  // caminho nunca deixa o diretório num estado parcial nem destrói uma
  // geração anterior válida.
  const plans = await fetchPaidPlans();
  const captions = renderCaptionsMarkdown(buildCaptions(campaign));

  const browser = await chromium.launch();
  const shots: Shot[] = [];

  try {
    const page = await browser.newPage();

    for (const name of Object.keys(FORMATS) as FormatName[]) {
      const file = `gancho-${name}.png`;
      shots.push(await shoot(page, renderHook(FORMATS[name]), FORMATS[name], file));
    }

    const carouselFormat = FORMATS['instagram-feed'];
    for (let index = 0; index < CAROUSEL_SLIDE_COUNT; index += 1) {
      const file = `carrossel-${index + 1}.png`;
      shots.push(
        await shoot(
          page,
          renderCarouselSlide(index, carouselFormat, plans),
          carouselFormat,
          file,
        ),
      );
    }
  } finally {
    await browser.close();
  }

  // Reconciliação real antes de tocar no disco: se a contagem não bater,
  // aborta aqui — nada foi apagado nem escrito ainda.
  const expected = Object.keys(FORMATS).length + CAROUSEL_SLIDE_COUNT;
  if (shots.length !== expected) {
    throw new Error(
      `Esperava ${expected} imagens, gerei ${shots.length} em memória.`,
    );
  }

  // A partir daqui só há escrita de dados já validados — não há mais
  // nada que possa falhar antes que o diretório novo esteja completo.
  await rm(OUTPUT_DIR, {recursive: true, force: true});
  await mkdir(OUTPUT_DIR, {recursive: true});

  for (const shot of shots) {
    await writeFile(resolve(OUTPUT_DIR, shot.file), shot.buffer);
  }
  await writeFile(resolve(OUTPUT_DIR, 'captions.md'), captions, 'utf-8');

  console.log(
    `${shots.length} imagens + captions.md em marketing/output/ ` +
      `(campanha: ${campaign}, planos: ${plans
        .map((plan) => plan.name)
        .join(', ')})`,
  );
}

main().catch((error: Error) => {
  console.error(`\nFalha ao gerar as peças: ${error.message}\n`);
  process.exit(1);
});
