import { useMemo, useState } from 'react';
import LocationSelect from '../components/LocationSelect';
import TopAppBar from '../components/TopAppBar';
import { useVolta } from '../context/VoltaContext';
import { SMART_SEARCH_LOCATIONS } from '../data/locationOptions';
import { formatDateTime, formatTnd } from '../services/formatters';
import { validateLocationPair } from '../services/locationValidation';
import { Screen, SearchFilters, SearchResult, TransportMode } from '../types';

interface SearchScreenProps {
  navigate: (screen: Screen) => void;
}

type BookingStep = 'options' | 'payment' | 'confirmation';

type TransportOffer = {
  id: string;
  mode: TransportMode;
  title: string;
  tagline: string;
  priceTnd: number;
  durationMinutes: number;
  icon: string;
  accent: string;
  accentSoft: string;
  providerLabel: string;
  departure: string;
  destination: string;
  departureAt: string;
  availabilityLabel: string;
  badgeLabel: string;
  isLive: boolean;
};

type PaymentFormState = {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
};

const OFFER_STYLES: Record<
  TransportMode,
  Pick<TransportOffer, 'title' | 'tagline' | 'icon' | 'accent' | 'accentSoft'>
> = {
  louage: {
    title: 'Lounge / Premium',
    tagline: 'Trajet confort et embarquement prioritaire',
    icon: 'local_taxi',
    accent: '#006d36',
    accentSoft: 'rgba(0,109,54,0.12)',
  },
  metro: {
    title: 'Métro',
    tagline: 'Fast lane pour les déplacements urbains',
    icon: 'tram',
    accent: '#0f766e',
    accentSoft: 'rgba(15,118,110,0.12)',
  },
  bus: {
    title: 'Bus',
    tagline: 'Option économique avec couverture large',
    icon: 'directions_bus',
    accent: '#0040a1',
    accentSoft: 'rgba(0,64,161,0.12)',
  },
};

function getExamplePrice(mode: TransportMode, seed: number) {
  if (mode === 'louage') {
    return 22 + (seed % 12);
  }

  if (mode === 'metro') {
    return 2.2 + (seed % 4) * 0.3;
  }

  return 1.6 + (seed % 6) * 0.35;
}

function getExampleDuration(mode: TransportMode, seed: number) {
  if (mode === 'louage') {
    return 75 + (seed % 55);
  }

  if (mode === 'metro') {
    return 18 + (seed % 20);
  }

  return 35 + (seed % 35);
}

function getExampleDeparture(date: string, seed: number, mode: TransportMode) {
  const baseDate = !Number.isNaN(new Date(date).getTime()) ? new Date(date) : new Date();
  const departure = new Date(baseDate);
  const hourBase = mode === 'louage' ? 7 : mode === 'metro' ? 6 : 5;
  departure.setHours(hourBase + (seed % 9), (seed * 7) % 60, 0, 0);
  return departure.toISOString();
}

function buildExampleOffer(mode: TransportMode, filters: SearchFilters): TransportOffer {
  const styles = OFFER_STYLES[mode];
  const departure = filters.departure || 'Tunis';
  const destination = filters.destination || 'Sousse';
  const seed = departure.length * 9 + destination.length * 7 + mode.length * 11;

  return {
    id: `example-${mode}-${departure}-${destination}`,
    mode,
    title: styles.title,
    tagline: styles.tagline,
    priceTnd: getExamplePrice(mode, seed),
    durationMinutes: getExampleDuration(mode, seed),
    icon: styles.icon,
    accent: styles.accent,
    accentSoft: styles.accentSoft,
    providerLabel:
      mode === 'louage'
        ? 'Estimation premium sans backend'
        : mode === 'metro'
          ? 'Simulation de trajet métro/TGM'
          : 'Simulation de trajet bus urbain',
    departure,
    destination,
    departureAt: getExampleDeparture(filters.date, seed, mode),
    availabilityLabel: mode === 'louage' ? '2 places estimées' : 'Passage estimé disponible',
    badgeLabel: 'Estimation',
    isLive: false,
  };
}

function buildOfferFromResult(mode: TransportMode, result: SearchResult): TransportOffer {
  const styles = OFFER_STYLES[mode];

  return {
    id: result.id,
    mode,
    title: styles.title,
    tagline: styles.tagline,
    priceTnd: result.priceTnd,
    durationMinutes: result.durationMinutes,
    icon: styles.icon,
    accent: styles.accent,
    accentSoft: styles.accentSoft,
    providerLabel: result.providerLabel,
    departure: result.departure,
    destination: result.destination,
    departureAt: result.departureAt,
    availabilityLabel:
      mode === 'louage'
        ? `${result.remainingSeats ?? 1} place(s) restante(s)`
        : 'Disponible maintenant',
    badgeLabel: 'Live',
    isLive: true,
  };
}

// Build three bookable offers that react to the selected route.
function buildTransportOffers(filters: SearchFilters, results: SearchResult[]) {
  return (['louage', 'metro', 'bus'] as TransportMode[]).map((mode) => {
    const liveResult = results.find((result) => result.mode === mode);
    return liveResult ? buildOfferFromResult(mode, liveResult) : buildExampleOffer(mode, filters);
  });
}

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();
}

function formatExpiryDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCvv(value: string) {
  return value.replace(/\D/g, '').slice(0, 4);
}

function validatePaymentForm(paymentForm: PaymentFormState) {
  if (!paymentForm.cardholderName.trim()) {
    return 'Veuillez saisir le nom du titulaire de la carte.';
  }

  if (paymentForm.cardNumber.replace(/\s/g, '').length !== 16) {
    return 'Veuillez saisir un numéro de carte valide sur 16 chiffres.';
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentForm.expiryDate)) {
    return 'Veuillez saisir une date d’expiration au format MM/AA.';
  }

  if (![3, 4].includes(paymentForm.cvv.length)) {
    return 'Veuillez saisir un code CVV valide.';
  }

  return '';
}

export default function SearchScreen({ navigate }: SearchScreenProps) {
  const { searchTransport } = useVolta();
  const [step, setStep] = useState<BookingStep>('options');
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [selectionFeedback, setSelectionFeedback] = useState('');
  const [routeValidationVisible, setRouteValidationVisible] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    departure: 'Tunis',
    destination: 'Sousse',
    date: new Date().toISOString().slice(0, 10),
    sortBy: 'cheapest',
  });
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const results = useMemo(() => searchTransport(filters), [filters, searchTransport]);
  const offers = useMemo(() => buildTransportOffers(filters, results), [filters, results]);
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId) ?? null;
  const routeValidationMessage = routeValidationVisible
    ? validateLocationPair(filters.departure, filters.destination, 'lieu')
    : '';

  const resetFlowForNewSearch = (nextFilters: SearchFilters) => {
    setFilters(nextFilters);
    setStep('options');
    setSelectedOfferId('');
    setSelectionFeedback('');
    setPaymentFeedback('');
    setConfirmationCode('');
    setRouteValidationVisible(false);
  };

  const handleProceedToPayment = () => {
    setSelectionFeedback('');
    setRouteValidationVisible(true);

    if (routeValidationMessage) {
      return;
    }

    if (!selectedOffer) {
      setSelectionFeedback('Veuillez sélectionner une option de transport avant de continuer.');
      return;
    }

    setStep('payment');
  };

  // Step 2: mock payment is fully client-side and moves to confirmation.
  const handlePaymentSubmit = () => {
    if (!selectedOffer) {
      setStep('options');
      setSelectionFeedback('Veuillez choisir une option avant de payer.');
      return;
    }

    const validationMessage = validatePaymentForm(paymentForm);
    setPaymentFeedback(validationMessage);

    if (validationMessage) {
      return;
    }

    setConfirmationCode(`VL-${Date.now().toString().slice(-6)}`);
    setPaymentFeedback('');
    setStep('confirmation');
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar
        title="Réservation interactive"
        subtitle="Choix du transport, paiement et confirmation"
        onBack={() => navigate('explore')}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                Étape 1
              </p>
              <h2 className="mt-2 font-headline text-3xl font-extrabold text-slate-950">
                Choisissez votre trajet
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500">
              Flow complet sans backend
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <LocationSelect
              label="Lieu de départ"
              placeholder="-- Choisissez un lieu --"
              value={filters.departure}
              options={SMART_SEARCH_LOCATIONS}
              searchPlaceholder="Rechercher une ville ou une station"
              emptyStateLabel="Aucun lieu ne correspond à votre recherche."
              excludedValue={filters.destination || undefined}
              invalid={Boolean(routeValidationMessage)}
              onChange={(departure) =>
                resetFlowForNewSearch({
                  ...filters,
                  departure,
                  destination: filters.destination === departure ? '' : filters.destination,
                })
              }
            />
            <LocationSelect
              label="Lieu de destination"
              placeholder="-- Choisissez un lieu --"
              value={filters.destination}
              options={SMART_SEARCH_LOCATIONS}
              searchPlaceholder="Rechercher une ville ou une station"
              emptyStateLabel="Aucun lieu ne correspond à votre recherche."
              excludedValue={filters.departure || undefined}
              invalid={Boolean(routeValidationMessage)}
              onChange={(destination) =>
                resetFlowForNewSearch({
                  ...filters,
                  destination,
                  departure: filters.departure === destination ? '' : filters.departure,
                })
              }
            />
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Date de départ</span>
              <input
                value={filters.date}
                onChange={(event) =>
                  resetFlowForNewSearch({
                    ...filters,
                    date: event.target.value,
                  })
                }
                className="rounded-[1.4rem] border border-slate-200 bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                type="date"
              />
            </label>
          </div>

          {routeValidationMessage ? (
            <p className="mt-4 text-sm font-medium text-red-600">{routeValidationMessage}</p>
          ) : null}
        </section>

        {step === 'options' && (
          <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  Offres disponibles
                </p>
                <h2 className="mt-2 font-headline text-3xl font-extrabold text-slate-950">
                  Sélectionnez votre mode de transport
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500">
                {results.filter((result) => result.mode === 'louage' || result.mode === 'metro' || result.mode === 'bus').length}{' '}
                résultats source
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {/* Step 1: cards store the chosen transport locally before payment. */}
              {offers.map((offer) => {
                const isSelected = offer.id === selectedOfferId;

                return (
                  <article
                    key={offer.id}
                    className={`rounded-[1.8rem] border p-5 transition ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]'
                        : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className="flex h-14 w-14 items-center justify-center rounded-[1.25rem]"
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.14)' : offer.accentSoft,
                          color: isSelected ? '#ffffff' : offer.accent,
                        }}
                      >
                        <span className="material-symbols-outlined text-[28px]">{offer.icon}</span>
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                          isSelected ? 'bg-white/12 text-white' : 'bg-white text-slate-500'
                        }`}
                      >
                        {offer.badgeLabel}
                      </span>
                    </div>

                    <h3 className="mt-5 font-headline text-2xl font-extrabold">{offer.title}</h3>
                    <p className={`mt-2 text-sm leading-6 ${isSelected ? 'text-white/78' : 'text-slate-500'}`}>
                      {offer.tagline}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className={`rounded-[1.25rem] p-4 ${isSelected ? 'bg-white/8' : 'bg-white'}`}>
                        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                          Trajet
                        </p>
                        <p className="mt-2 text-sm font-semibold">
                          {offer.departure} -&gt; {offer.destination}
                        </p>
                      </div>
                      <div className={`rounded-[1.25rem] p-4 ${isSelected ? 'bg-white/8' : 'bg-white'}`}>
                        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                          Départ
                        </p>
                        <p className="mt-2 text-sm font-semibold">{formatDateTime(offer.departureAt)}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                          Prix estimé
                        </p>
                        <p className="mt-2 font-headline text-3xl font-extrabold">
                          {formatTnd(offer.priceTnd)}
                        </p>
                        <p className={`mt-2 text-sm ${isSelected ? 'text-white/72' : 'text-slate-500'}`}>
                          {offer.durationMinutes} min • {offer.availabilityLabel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOfferId(offer.id);
                          setSelectionFeedback('');
                        }}
                        className={`rounded-full px-5 py-3 text-sm font-bold ${
                          isSelected
                            ? 'bg-white text-slate-950'
                            : 'bg-[linear-gradient(135deg,_#0040a1_0%,_#006d36_160%)] text-white'
                        }`}
                      >
                        {isSelected ? 'Sélectionné' : 'Sélectionner'}
                      </button>
                    </div>

                    <p className={`mt-4 text-sm ${isSelected ? 'text-white/72' : 'text-slate-500'}`}>
                      {offer.providerLabel}
                    </p>
                  </article>
                );
              })}
            </div>

            {selectionFeedback ? (
              <p className="mt-5 text-sm font-medium text-red-600">{selectionFeedback}</p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Choisissez une offre puis continuez vers le paiement sécurisé simulé.
              </p>
              <button
                type="button"
                onClick={handleProceedToPayment}
                className={`rounded-[1.4rem] px-6 py-4 text-sm font-bold ${
                  selectedOffer
                    ? 'bg-[linear-gradient(135deg,_#0040a1_0%,_#006d36_160%)] text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                Procéder au paiement
              </button>
            </div>
          </section>
        )}

        {step === 'payment' && selectedOffer && (
          <section className="grid gap-6 lg:grid-cols-[1fr_0.92fr]">
            <article className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                Étape 2
              </p>
              <h2 className="mt-2 font-headline text-3xl font-extrabold text-slate-950">
                Paiement
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Saisissez vos informations de carte pour confirmer votre réservation.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600 sm:col-span-2">
                  <span>Nom du titulaire</span>
                  <input
                    value={paymentForm.cardholderName}
                    onChange={(event) =>
                      setPaymentForm((current) => ({
                        ...current,
                        cardholderName: event.target.value,
                      }))
                    }
                    className="rounded-[1.4rem] border border-slate-200 bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                    placeholder="Ex : Amine Ben Salah"
                    type="text"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600 sm:col-span-2">
                  <span>Numéro de carte</span>
                  <input
                    value={paymentForm.cardNumber}
                    onChange={(event) =>
                      setPaymentForm((current) => ({
                        ...current,
                        cardNumber: formatCardNumber(event.target.value),
                      }))
                    }
                    className="rounded-[1.4rem] border border-slate-200 bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                    type="text"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                  <span>Date d’expiration</span>
                  <input
                    value={paymentForm.expiryDate}
                    onChange={(event) =>
                      setPaymentForm((current) => ({
                        ...current,
                        expiryDate: formatExpiryDate(event.target.value),
                      }))
                    }
                    className="rounded-[1.4rem] border border-slate-200 bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                    placeholder="MM/AA"
                    inputMode="numeric"
                    type="text"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                  <span>CVV</span>
                  <input
                    value={paymentForm.cvv}
                    onChange={(event) =>
                      setPaymentForm((current) => ({
                        ...current,
                        cvv: formatCvv(event.target.value),
                      }))
                    }
                    className="rounded-[1.4rem] border border-slate-200 bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                    placeholder="123"
                    inputMode="numeric"
                    type="password"
                  />
                </label>
              </div>

              {paymentFeedback ? (
                <p className="mt-5 text-sm font-medium text-red-600">{paymentFeedback}</p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStep('options')}
                  className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700"
                >
                  Retour aux options
                </button>
                <button
                  type="button"
                  onClick={handlePaymentSubmit}
                  className="rounded-full bg-[linear-gradient(135deg,_#0040a1_0%,_#006d36_160%)] px-6 py-3 text-sm font-bold text-white"
                >
                  Confirmer le paiement
                </button>
              </div>
            </article>

            <aside className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                Récapitulatif
              </p>
              <div
                className="mt-4 rounded-[1.6rem] p-5"
                style={{ backgroundColor: selectedOffer.accentSoft }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-headline text-2xl font-extrabold text-slate-950">
                      {selectedOffer.title}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{selectedOffer.providerLabel}</p>
                  </div>
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-[1rem]"
                    style={{ backgroundColor: selectedOffer.accent, color: '#ffffff' }}
                  >
                    <span className="material-symbols-outlined">{selectedOffer.icon}</span>
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] bg-white/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Trajet
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {selectedOffer.departure} -&gt; {selectedOffer.destination}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-white/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Départ
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {formatDateTime(selectedOffer.departureAt)}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-white/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Durée
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {selectedOffer.durationMinutes} min
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-white/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Prix
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {formatTnd(selectedOffer.priceTnd)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                Paiement simulé localement. Aucun backend n’est requis pour compléter le flow.
              </div>
            </aside>
          </section>
        )}

        {step === 'confirmation' && selectedOffer && (
          <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="mx-auto max-w-3xl text-center">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(0,109,54,0.12)] text-[#006d36]">
                <span className="material-symbols-outlined text-[40px]">check_circle</span>
              </span>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                Étape 3
              </p>
              <h2 className="mt-2 font-headline text-4xl font-extrabold text-slate-950">
                Paiement confirmé
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Votre réservation {selectedOffer.title.toLowerCase()} est confirmée pour le trajet{' '}
                {selectedOffer.departure} -&gt; {selectedOffer.destination}.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Code
                  </p>
                  <p className="mt-2 font-headline text-2xl font-extrabold text-slate-950">
                    {confirmationCode}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Montant
                  </p>
                  <p className="mt-2 font-headline text-2xl font-extrabold text-slate-950">
                    {formatTnd(selectedOffer.priceTnd)}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Départ
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {formatDateTime(selectedOffer.departureAt)}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('options');
                    setSelectedOfferId('');
                    setPaymentFeedback('');
                    setConfirmationCode('');
                    setPaymentForm({
                      cardholderName: '',
                      cardNumber: '',
                      expiryDate: '',
                      cvv: '',
                    });
                  }}
                  className="rounded-full bg-[linear-gradient(135deg,_#0040a1_0%,_#006d36_160%)] px-6 py-3 text-sm font-bold text-white"
                >
                  Réserver un autre trajet
                </button>
                <button
                  type="button"
                  onClick={() => navigate('explore')}
                  className="rounded-full bg-slate-100 px-6 py-3 text-sm font-bold text-slate-700"
                >
                  Retour à l’accueil
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
