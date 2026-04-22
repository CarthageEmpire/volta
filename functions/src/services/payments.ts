import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { paymentProviderSchema } from '../schemas.js';

export type PaymentProvider = z.infer<typeof paymentProviderSchema>;

export interface PaymentChargeResult {
  provider: PaymentProvider;
  status: 'pending' | 'paid' | 'failed';
  summary: string;
  providerReference: string;
  processor: 'internal' | 'gateway';
}

export async function chargePayment(params: {
  provider: PaymentProvider;
  amountTnd: number;
  title: string;
}): Promise<PaymentChargeResult> {
  const provider = paymentProviderSchema.parse(params.provider);

  if (params.amountTnd <= 0) {
    throw new HttpsError('invalid-argument', 'Payment amount must be greater than zero.');
  }

  const normalizedTitle = params.title.trim();
  const reference = `volta-${provider}-${Date.now()}`;
  const pendingProviders = new Set(
    String(process.env.VOLTA_PENDING_PAYMENT_PROVIDERS ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

  if (pendingProviders.has(provider)) {
    return {
      provider,
      status: 'pending',
      summary: `${normalizedTitle} en attente de confirmation ${provider.toUpperCase()}.`,
      providerReference: reference,
      processor: 'internal',
    };
  }

  return {
    provider,
    status: 'paid',
    summary: `${normalizedTitle} confirme via le connecteur ${provider.toUpperCase()}.`,
    providerReference: reference,
    processor: 'internal',
  };
}
