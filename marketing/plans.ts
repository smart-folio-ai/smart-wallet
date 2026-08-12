export type MarketingPlan = {name: string; price: number};

const PLANS_URL = 'https://api.trakkerwallet.com.br/subscription';
const MAX_PLANS = 3;

type RawPlan = {name?: unknown; price?: unknown; isActive?: unknown};

export function selectPaidPlans(raw: unknown): MarketingPlan[] {
  if (!Array.isArray(raw)) {
    throw new Error(
      `Resposta inesperada de ${PLANS_URL}: esperava uma lista de planos.`,
    );
  }

  const paid = (raw as RawPlan[])
    .filter(
      (item) =>
        item?.isActive === true &&
        typeof item.name === 'string' &&
        typeof item.price === 'number' &&
        item.price > 0,
    )
    .map((item) => ({name: item.name as string, price: item.price as number}))
    .sort((a, b) => a.price - b.price);

  if (paid.length === 0) {
    throw new Error(
      'Nenhum plano pago ativo encontrado. Uma peça de preço sem preço não ' +
        'deve ser gerada.',
    );
  }

  // Um carrossel não comporta mais de três planos de forma legível.
  return paid.slice(0, MAX_PLANS);
}

export async function fetchPaidPlans(): Promise<MarketingPlan[]> {
  let response: Response;
  try {
    response = await fetch(PLANS_URL);
  } catch (error) {
    throw new Error(
      `Não foi possível alcançar ${PLANS_URL}: ${(error as Error).message}`,
    );
  }

  if (!response.ok) {
    throw new Error(`${PLANS_URL} respondeu ${response.status}.`);
  }

  return selectPaidPlans(await response.json());
}
