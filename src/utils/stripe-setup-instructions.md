
# Configuração do Stripe - Instruções

## 1. Configuração Inicial

### Criar conta no Stripe
1. Acesse https://stripe.com
2. Crie sua conta
3. Complete a verificação da conta

### Obter chaves da API
1. No dashboard do Stripe, vá em "Desenvolvedores" > "Chaves da API"
2. Copie a "Chave secreta" (sk_...)
3. Copie a "Chave publicável" (pk_...)

## 2. Criar Produtos e Preços

### No dashboard do Stripe:
1. Vá em "Produtos"
2. Clique em "Adicionar produto"
3. Crie os produtos:
   - **Investidor Pro**: R$ 14,90/mês
   - **Premium**: R$ 24,90/mês

### Copiar Price IDs:
Após criar os produtos, copie os Price IDs (price_...) e substitua no arquivo `Subscription.tsx`:
```typescript
stripePriceId: 'price_SEU_ID_AQUI'
```

## 3. Configurar Supabase Edge Function

### Criar a Edge Function:
```bash
supabase functions new create-checkout
```

### Código da Edge Function (`create-checkout/index.ts`):
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId, planId } = await req.json();
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/subscription`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
```

## 4. Configurar Secrets no Supabase

### No dashboard do Supabase:
1. Vá em "Edge Functions"
2. Clique em "Manage secrets"
3. Adicione:
   - `STRIPE_SECRET_KEY`: sua chave secreta do Stripe

## 5. Atualizar código da aplicação

### No arquivo `Subscription.tsx`, descomente e ajuste:
```typescript
const { data, error } = await supabase.functions.invoke('create-checkout', {
  body: {
    priceId: plan.stripePriceId,
    planId: plan.id,
    period: pricingPeriod
  }
});

if (error) throw error;

if (data.url) {
  window.location.href = data.url;
}
```

## 6. Criar páginas de retorno

### Página de sucesso (`/success`):
- Confirmar pagamento
- Mostrar detalhes da assinatura
- Redirecionar para dashboard

### Página de cancelamento:
- Voltar para página de preços
- Mostrar opções alternativas

## 7. Configurar Webhooks (Opcional)

### Para sincronizar status de assinatura:
1. No Stripe, vá em "Desenvolvedores" > "Webhooks"
2. Adicione endpoint: `https://seu-projeto.supabase.co/functions/v1/webhook-stripe`
3. Selecione eventos:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 8. Testar integração

### Modo de teste:
1. Use chaves de teste do Stripe (sk_test_...)
2. Use cartões de teste: 4242 4242 4242 4242
3. Teste fluxo completo de checkout

### Ir para produção:
1. Ative sua conta Stripe
2. Substitua chaves de teste por chaves de produção
3. Configure domínio de produção nas URLs

## Notas importantes:
- ⚠️ Nunca exponha chaves secretas no frontend
- 🔒 Use sempre HTTPS em produção
- 📝 Implemente logs para debugging
- 🧪 Teste thoroughly antes de ir para produção
