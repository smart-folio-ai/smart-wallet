# Peças de marketing

Gera as peças da campanha a partir dos tokens reais da marca e dos preços
reais dos planos.

```bash
node marketing/generate.ts                      # campanha "validacao"
node marketing/generate.ts --campaign=lancamento # outra campanha
```

Também disponível como `bun run marketing` (o script `marketing` do
`package.json` roda `node marketing/generate.ts` — o gerador usa
`chromium.launch()`, que trava indefinidamente sob o runtime do Bun neste
ambiente; sob Node ele roda normalmente).

Saída em `marketing/output/` (fora do git): 9 PNGs e um `captions.md` com as
legendas e os links de atribuição prontos para colar.

## Por que isto existe e não um Canva

As peças exibem preço. Uma peça publicada com preço errado circula
indefinidamente e não há como corrigi-la. Aqui o preço vem de
`GET /subscription` na geração, então basta regerar depois de qualquer
mudança.

## Quando falha

O gerador falha sem escrever arquivo nenhum se a API de planos não responder,
se não houver plano pago ativo, se as fontes do Google não carregarem, ou se
o nome da campanha tiver acento ou espaço — o servidor descartaria essa
atribuição em silêncio.

## Alterar a copy

`content.ts` para o texto das peças, `captions.ts` para as legendas.
As cores vivem em `brand.ts` e são verificadas contra `src/index.css` por
`brand.spec.ts` — mude no CSS primeiro.
