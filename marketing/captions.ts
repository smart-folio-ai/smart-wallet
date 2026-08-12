import {buildLandingUrl, type Channel} from './utm';

export type CaptionEntry = {
  piece: string;
  channel: Channel;
  caption: string;
  link: string;
  linkNote?: string;
};

const HOOK_CAPTION_SHORT =
  'Ativos em três corretoras, uma planilha desatualizada e o IR chegando. ' +
  'O Trackerr consolida a carteira inteira e já calcula o imposto.';

const HOOK_CAPTION_LONG =
  'Quem investe há algum tempo raramente trava por falta de ativo. ' +
  'Trava por falta de visão do conjunto: cada corretora mostra um pedaço, ' +
  'a planilha que junta tudo está sempre desatualizada, e a concentração ' +
  'aparece quando o papel já caiu.\n\n' +
  'O Trackerr consolida todas as corretoras, calcula a apuração mensal do ' +
  'IR com prejuízo compensado, e usa IA para dizer o que exige atenção ' +
  'agora — em ordem, com o motivo em uma linha.\n\n' +
  'Grátis até 10 ativos, sem cartão.';

const CAROUSEL_CAPTION =
  'Cinco slides sobre o problema que ninguém resolve com mais uma corretora. ' +
  'Arrasta para o lado.\n\n' +
  'Grátis até 10 ativos, sem cartão.';

const FEED_LINK_NOTE =
  'O feed do Instagram não aceita link em legenda. Coloque este link na bio ' +
  'enquanto a campanha estiver no ar — a atribuição fica no nível do canal, ' +
  'não do post.';

export function buildCaptions(campaign: string): CaptionEntry[] {
  return [
    {
      piece: 'gancho-instagram-feed',
      channel: 'instagram',
      caption: HOOK_CAPTION_SHORT,
      link: buildLandingUrl('instagram', campaign),
      linkNote: FEED_LINK_NOTE,
    },
    {
      piece: 'gancho-instagram-story',
      channel: 'instagram',
      caption: HOOK_CAPTION_SHORT,
      link: buildLandingUrl('instagram', campaign),
      linkNote: 'Use o sticker de link do stories com esta URL.',
    },
    {
      piece: 'gancho-linkedin',
      channel: 'linkedin',
      caption: HOOK_CAPTION_LONG,
      link: buildLandingUrl('linkedin', campaign),
    },
    {
      piece: 'gancho-x',
      channel: 'x',
      caption: HOOK_CAPTION_SHORT,
      link: buildLandingUrl('x', campaign),
    },
    {
      piece: 'carrossel-instagram-feed',
      channel: 'instagram',
      caption: CAROUSEL_CAPTION,
      link: buildLandingUrl('instagram', campaign),
      linkNote: FEED_LINK_NOTE,
    },
  ];
}

export function renderCaptionsMarkdown(entries: CaptionEntry[]): string {
  const sections = entries.map((entry) => {
    const note = entry.linkNote ? `\n\n> ${entry.linkNote}` : '';
    return `## ${entry.piece}\n\n${entry.caption}\n\n${entry.link}${note}`;
  });

  return `# Legendas da campanha\n\n${sections.join('\n\n---\n\n')}\n`;
}
