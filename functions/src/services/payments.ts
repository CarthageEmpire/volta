import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { paymentProviderSchema } from '../schemas.js';

export type PaymentProvider = z.infer<typeof paymentProviderSchema>;

export interface PaymentChargeResult {
  provider: PaymentProvider;
  status: 'paid';
  summary: string;
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

  return {
    provider,
    status: 'paid',
    summary: `${params.title} via ${provider} (stubbed gateway)`,
  };
}
