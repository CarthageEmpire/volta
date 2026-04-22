import { MouseEvent, PointerEvent, useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import { PAYMENT_METHODS } from '../constants';
import { useVolta } from '../context/VoltaContext';
import { formatDateTime, formatTnd } from '../services/formatters';
import { PaymentProvider, PaymentStatus, Screen } from '../types';

interface PaymentScreenProps {
  navigate: (screen: Screen) => void;
}

export default function PaymentScreen({ navigate }: PaymentScreenProps) {
  const { checkout, confirmCheckoutPayment } = useVolta();
  const [method, setMethod] = useState<PaymentProvider>('bank_card');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completion, setCompletion] = useState<{
    title: string;
    amountTnd: number;
    departureAt: string;
    origin: string;
    destination: string;
    paymentStatus: PaymentStatus;
    message: string;
  } | null>(null);

  if (!checkout && !completion) {
    return (
      <div className="min-h-screen bg-background pb-40 sm:pb-32">
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

  const submitPayment = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = await confirmCheckoutPayment(method);
    setFeedback(result.message ?? '');
    setIsSubmitting(false);
    if (result.ok && checkout && result.paymentStatus) {
      setCompletion({
        title: checkout.title,
        amountTnd: checkout.amountTnd,
        departureAt: checkout.departureAt,
        origin: checkout.origin,
        destination: checkout.destination,
        paymentStatus: result.paymentStatus,
        message: result.message ?? '',
      });
    }
  };

  const selectMethod = (nextMethod: PaymentProvider) => {
    setMethod(nextMethod);
  };

  const preventMethodFocus = (
    event: MouseEvent<HTMLButtonElement> | PointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const getMethodCardStyle = (isSelected: boolean) =>
    isSelected
      ? {
          backgroundColor: '#dae2ff',
          boxShadow: 'inset 0 0 0 2px #0040a1, 0 14px 35px rgba(0, 64, 161, 0.12)',
        }
      : {
          backgroundColor: '#f1f5f9',
        };

  if (!checkout && completion) {
    const isPaid = completion.paymentStatus === 'paid';
    const badgeClasses = isPaid
      ? 'bg-emerald-100 text-emerald-700'
      : completion.paymentStatus === 'pending'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-100 text-slate-700';

    return (
      <div className="min-h-screen bg-background pb-40 sm:pb-32">
        <TopAppBar
          title="Paiement"
          subtitle="Etat confirme par le backend"
          onBack={() => navigate('explore')}
        />

        <main className="mx-auto max-w-3xl px-6 py-12">
          <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] ${badgeClasses}`}>
                {completion.paymentStatus === 'paid'
                  ? 'Paiement confirme'
                  : completion.paymentStatus === 'pending'
                    ? 'Paiement en attente'
                    : completion.paymentStatus}
              </span>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                {formatTnd(completion.amountTnd)}
              </span>
            </div>

            <h2 className="mt-5 font-headline text-3xl font-extrabold text-slate-950">
              {completion.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{completion.message}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.4rem] bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Trajet
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {completion.origin} -&gt; {completion.destination}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Depart
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {formatDateTime(completion.departureAt)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              {isPaid
                ? 'Le ticket et la reservation ont ete enregistres. Vous pouvez ouvrir la section Tickets pour afficher le QR code et l historique de paiement.'
                : 'La reservation et le paiement sont enregistres cote backend. Le ticket sera genere seulement apres confirmation du fournisseur.'}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('tickets')}
                className="rounded-full bg-[linear-gradient(135deg,_#0040a1_0%,_#006d36_160%)] px-5 py-3 text-sm font-bold text-white"
              >
                Voir mes tickets
              </button>
              <button
                type="button"
                onClick={() => navigate('explore')}
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700"
              >
                Retour accueil
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40 sm:pb-32">
      <TopAppBar
        title="Paiement"
        subtitle="Resume, validation et generation ticket"
        onBack={() => navigate('explore')}
      />

      <main className="mx-auto grid max-w-5xl items-start gap-6 px-6 py-8 lg:grid-cols-[1fr_0.9fr]">
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
                onMouseDown={preventMethodFocus}
                onPointerDown={preventMethodFocus}
                onClick={() => selectMethod(item.id)}
                aria-pressed={method === item.id}
                className="flex min-h-[5.75rem] w-full touch-manipulation items-center justify-between rounded-[1.4rem] px-4 py-4 text-left text-slate-900 transition"
                style={{
                  ...getMethodCardStyle(method === item.id),
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div className="pr-4">
                  <p className="font-bold">{item.label}</p>
                  <p className={`mt-1 text-sm ${method === item.id ? 'text-slate-700' : 'text-slate-500'}`}>
                    {item.subtitle}
                  </p>
                </div>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    method === item.id ? 'border-primary bg-white' : 'border-slate-500 bg-transparent'
                  }`}
                  aria-hidden="true"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      method === item.id ? 'bg-primary' : 'bg-transparent'
                    }`}
                  />
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
            Le backend persiste d abord le paiement puis la reservation. Le ticket n est genere
            que si le statut fournisseur devient `paid`. Pour le louage, le payout conducteur
            reste retenu jusqu a confirmation passager.
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
