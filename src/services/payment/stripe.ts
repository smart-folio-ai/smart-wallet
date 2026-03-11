import Stripe from 'stripe';
import {
  cancelUrl,
  stripPrivateApiKey,
  successUrl,
  urlWebProduction,
} from '@/utils/env';

export const stripe = new Stripe(stripPrivateApiKey, {
  apiVersion: '2025-05-28.basil',
  appInfo: {
    name: 'Trakker',
    version: '1.0.0',
  },
});

export default async function handler(req, res) {
  const {priceId} = req.body;
  // (Opcional) Verifique autenticação do usuário aqui

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'boleto', 'pix'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${urlWebProduction}${successUrl}`,
    cancel_url: `${urlWebProduction}${cancelUrl}`,
    // (Opcional) customer, metadata, etc
  });

  res.json({url: session.url});
}
