export interface AssetDisplay {
  badge: string;
  title: string;
  subtitle?: string;
}

const FIXED_INCOME_PRODUCT = /^(LCA|LCI|CDB|CRI|CRA|LF|LIG|DEB[A-Z]*|NTN-?[A-Z]*|LTN|LFT|TESOURO\b[^-]*)\s*-\s*(.+)$/i;

const titleCase = (text: string) =>
  text
    .toLowerCase()
    .replace(/(^|[\s/(.-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    .replace(/\b(Fii|Fiagro|Etf|Bdr|S\.a)\b/g, (m) => m.toUpperCase());

/**
 * O relatório da B3 identifica renda fixa pelo código do título
 * ("25F08539417"), que sozinho não diz nada. O produto vem no nome —
 * "LCA - 25F08539417 - BANCO COOPERATIVO SICOOB" — e vira "LCA · Banco
 * Cooperativo Sicoob", com o código na segunda linha.
 */
export function describeAsset(asset: {symbol: string; name?: string}): AssetDisplay {
  const symbol = String(asset.symbol || '').trim();
  const name = String(asset.name || '').trim();

  const product = name.match(FIXED_INCOME_PRODUCT);
  if (product) {
    const kind = product[1].toUpperCase().trim();
    const parts = product[2].split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean);
    const issuer = parts.filter((p) => p.toUpperCase() !== symbol.toUpperCase()).join(' - ');
    return {
      badge: kind.slice(0, 3),
      title: issuer ? `${kind} · ${titleCase(issuer)}` : kind,
      subtitle: symbol || undefined,
    };
  }

  // Ações e FIIs chegam como "PETR4 - PETROLEO BRASILEIRO S.A. PETROBRAS".
  const withoutSymbol = name.replace(new RegExp(`^${symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*-\\s*`, 'i'), '');
  const subtitle =
    withoutSymbol && withoutSymbol.toUpperCase() !== symbol.toUpperCase()
      ? titleCase(withoutSymbol)
      : undefined;

  return {badge: symbol.replace(/[^A-Z0-9]/gi, '').slice(0, 3).toUpperCase(), title: symbol, subtitle};
}
