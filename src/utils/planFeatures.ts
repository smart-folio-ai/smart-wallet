type RankedPlan = {_id: string; accessLevel?: number; price: number; features?: string[]};

const isBelow = (a: RankedPlan, b: RankedPlan) => {
  const levelA = a.accessLevel ?? 0;
  const levelB = b.accessLevel ?? 0;
  return levelA < levelB || (levelA === levelB && a.price < b.price);
};

/**
 * Recursos de cada plano somados aos de todos os planos abaixo dele (por
 * nível de acesso, depois preço): o que o Essencial tem o Pro e o Wealth
 * também têm, mesmo que um plano criado no admin não repita a lista.
 */
export function cumulativeFeatures(plans: RankedPlan[]): Map<string, string[]> {
  const ordered = [...plans].sort((a, b) => (isBelow(a, b) ? -1 : isBelow(b, a) ? 1 : 0));
  const result = new Map<string, string[]>();
  for (const plan of ordered) {
    const inherited = ordered.filter((other) => isBelow(other, plan)).flatMap((other) => other.features ?? []);
    result.set(plan._id, Array.from(new Set([...inherited, ...(plan.features ?? [])])));
  }
  return result;
}
