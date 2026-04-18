import { useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import { PAYMENT_METHODS } from '../constants';
import { useVolta } from '../context/VoltaContext';
import { formatDateTime, formatTnd } from '../services/formatters';
import { PaymentProvider, Screen } from '../types';

interface PaymentScreenProps {
  navigate: (screen: Screen) => void;
}

export default function PaymentScreen({ navigate }: PaymentScreenProps) {
  const { checkout, confirmCheckoutPayment } = useVolta();
  const [method, setMethod] = useState<PaymentProvider>('bank_card');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!checkout) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <TopAppBar
          title="Paiement"
          subtitle="Aucune commande selectionnee"
          onBack={() => navigate('explore')}
        />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm text-slate-500">Choisissez d'abord un trajet ou une ligne.</p>
          </div>
        </main>
      </div>
    );
  }

  const submitPayment = () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = confirmCheckoutPayment(method);
    setFeedback(result.message ?? '');
    setIsSubmitting(false);
    if (result.ok) {
      navigate('tickets');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar
        title="Paiement"
        subtitle="Resume, validation et generation ticket"
        onBack={() => navigate('explore')}
      />

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Commande</p>
          <h2 className="mt-3 font-headline text-3xl font-extrabold text-slate-950">
            {checkout.title}
          </h2>
          <p className="mt-2 text-sm text-slate-500">{checkout.description}</p>

          <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Depart</p>
                <p className="mt-2 font-semibold text-slate-900">{checkout.origin}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Destination</p>
                <p className="mt-2 font-semibold text-slate-900">{checkout.destination}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Mode</p>
                <p className="mt-2 font-semibold text-slate-900">{checkout.mode}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Depart estime</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {formatDateTime(checkout.departureAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {PAYMENT_METHODS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMethod(item.id)}
                className={`flex w-full items-center justify-between rounded-[1.4rem] px-4 py-4 text-left ${
                  method === item.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
                }`}
              >
                <div>
                  <p className="font-bold">{item.label}</p>
                  <p className={`mt-1 text-sm ${method === item.id ? 'text-white/70' : 'text-slate-500'}`}>
                    {item.subtitle}
                  </p>
                </div>
                <span className="material-symbols-outlined">
                  {method === item.id ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Sous-total</span>
              <span className="font-semibold text-slate-900">{formatTnd(checkout.amountTnd)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">Frais</span>
              <span className="font-semibold text-slate-900">{formatTnd(0)}</span>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="font-bold text-slate-900">Total</span>
              <span className="font-headline text-2xl font-extrabold text-slate-950">
                {formatTnd(checkout.amountTnd)}
              </span>
            </div>
          </div>

          <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            Le ticket est genere apres paiement. Pour le louage, le payout conducteur reste
            en attente jusqu'a confirmation passager.
          </div>

          {feedback && (
            <div className="mt-5 rounded-[1.5rem] bg-slate-100 p-4 text-sm font-semibold text-slate-700">
              {feedback}
            </div>
          )}

          <button
            type="button"
            onClick={submitPayment}
            disabled={isSubmitting}
            className="mt-6 w-full rounded-[1.6rem] bg-[linear-gradient(135deg,_#0040a1_0%,_#006d36_160%)] py-5 font-headline text-xl font-extrabold text-white disabled:bg-slate-300"
          >
            {isSubmitting ? 'Paiement...' : 'Confirmer le paiement'}
          </button>
        </aside>
      </main>
    </div>
  );
}
