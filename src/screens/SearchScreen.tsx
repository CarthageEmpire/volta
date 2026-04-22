import { useState } from 'react';
import LocationSelect from '../components/LocationSelect';
import TopAppBar from '../components/TopAppBar';
import { useVolta } from '../context/VoltaContext';
import { SMART_SEARCH_LOCATIONS } from '../data/locationOptions';
import { formatDateTime, formatTnd } from '../services/formatters';
import { searchTransportRemote } from '../services/firebaseVoltaService';
import { validateLocationPair } from '../services/locationValidation';
import { Screen, SearchFilters, SearchResult } from '../types';

interface SearchScreenProps {
  navigate: (screen: Screen) => void;
}

function getModeLabel(result: SearchResult) {
  if (result.mode === 'louage') {
    return 'Louage';
  }

  if (result.mode === 'metro') {
    return 'Metro';
  }

  return 'Bus';
}

function getModeAccent(result: SearchResult) {
  if (result.mode === 'louage') {
    return {
      solid: 'linear-gradient(135deg, #006d36 0%, #0f9d58 100%)',
      softBackground: 'rgba(0,109,54,0.12)',
      softColor: '#006d36',
    };
  }

  if (result.mode === 'metro') {
    return {
      solid: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
      softBackground: 'rgba(15,118,110,0.12)',
      softColor: '#0f766e',
    };
  }

  return {
    solid: 'linear-gradient(135deg, #0040a1 0%, #0056d2 100%)',
    softBackground: 'rgba(0,64,161,0.12)',
    softColor: '#0040a1',
  };
}

function getMatchLabel(result: SearchResult) {
  switch (result.matchType) {
    case 'direct':
      return 'Trajet direct';
    case 'departure_area':
      return 'Depart via zone';
    case 'destination_area':
      return 'Arrivee via zone';
    case 'network_suggestion':
      return 'Zone correspondante';
    default:
      return 'Resultat backend';
  }
}

export default function SearchScreen({ navigate }: SearchScreenProps) {
  const { startLinePayment, startLouagePayment, state } = useVolta();
  const [filters, setFilters] = useState<SearchFilters>({
    departure: 'Tunis',
    destination: 'Sousse',
    date: new Date().toISOString().slice(0, 10),
    sortBy: 'cheapest',
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [feedback, setFeedback] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeResultId, setActiveResultId] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const validationMessage = showValidation
    ? validateLocationPair(filters.departure, filters.destination, 'lieu')
    : '';

  const runSearch = async () => {
    setShowValidation(true);
    const nextValidationMessage = validateLocationPair(filters.departure, filters.destination, 'lieu');
    if (nextValidationMessage) {
      setFeedback('');
      setResults([]);
      setHasLoaded(false);
      return;
    }

    setIsSearching(true);
    setFeedback('');
    try {
      const nextResults = await searchTransportRemote(filters);
      setResults(nextResults);
      setHasLoaded(true);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Impossible de lancer la recherche.');
      setResults([]);
      setHasLoaded(true);
    } finally {
      setIsSearching(false);
    }
  };

  const startCheckout = async (result: SearchResult) => {
    setActiveResultId(result.id);
    setFeedback('');
    try {
      const response =
        result.mode === 'louage'
          ? await startLouagePayment(result.sourceId)
          : await startLinePayment(result.sourceId);

      if (!response.ok) {
        setFeedback(response.message ?? 'Impossible de preparer le paiement.');
        return;
      }

      navigate('payment');
    } finally {
      setActiveResultId('');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar
        title="Recherche intelligente"
        subtitle="Resultats backend combines pour bus, metro et louage"
        onBack={() => navigate('explore')}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                Smart Search
              </p>
              <h2 className="mt-2 font-headline text-3xl font-extrabold text-slate-950">
                Comparez les trajets reels
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500">
              Backend Firestore + Functions
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <LocationSelect
              label="Lieu de depart"
              placeholder="-- Choisissez un lieu --"
              value={filters.departure}
              options={SMART_SEARCH_LOCATIONS}
              searchPlaceholder="Rechercher une ville ou une station"
              emptyStateLabel="Aucun lieu ne correspond a votre recherche."
              excludedValue={filters.destination || undefined}
              invalid={Boolean(validationMessage)}
              onChange={(departure) => {
                setShowValidation(false);
                setFilters((current) => ({
                  ...current,
                  departure,
                  destination: current.destination === departure ? '' : current.destination,
                }));
              }}
            />

            <LocationSelect
              label="Lieu de destination"
              placeholder="-- Choisissez un lieu --"
              value={filters.destination}
              options={SMART_SEARCH_LOCATIONS}
              searchPlaceholder="Rechercher une ville ou une station"
              emptyStateLabel="Aucun lieu ne correspond a votre recherche."
              excludedValue={filters.departure || undefined}
              invalid={Boolean(validationMessage)}
              onChange={(destination) => {
                setShowValidation(false);
                setFilters((current) => ({
                  ...current,
                  destination,
                  departure: current.departure === destination ? '' : current.departure,
                }));
              }}
            />

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Date souhaitee</span>
              <input
                value={filters.date}
                onChange={(event) => {
                  setShowValidation(false);
                  setFilters((current) => ({ ...current, date: event.target.value }));
                }}
                className="rounded-[1.4rem] border border-slate-200 bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                type="date"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Tri</span>
              <select
                value={filters.sortBy}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    sortBy: event.target.value as SearchFilters['sortBy'],
                  }))
                }
                className="rounded-[1.4rem] border border-slate-200 bg-slate-100 px-4 py-4 text-slate-900 outline-none"
              >
                <option value="cheapest">Prix le plus bas</option>
                <option value="duration">Trajet le plus rapide</option>
                <option value="departure">Depart le plus proche</option>
              </select>
            </label>
          </div>

          {validationMessage ? (
            <p className="mt-4 text-sm font-medium text-red-600">{validationMessage}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Les resultats restent stables tant que vous ne relancez pas la recherche.
            </p>
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={isSearching}
              className="rounded-[1.4rem] bg-[linear-gradient(135deg,_#0040a1_0%,_#006d36_160%)] px-6 py-4 text-sm font-bold text-white disabled:bg-slate-300"
            >
              {isSearching ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
        </section>

        {feedback ? (
          <section className="rounded-[1.6rem] bg-white p-4 text-sm font-semibold text-slate-700 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            {feedback}
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-4">
            {results.length > 0 ? (
              results.map((result) => {
                const accent = getModeAccent(result);
                return (
                  <article
                    key={result.id}
                    className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.22em]"
                            style={{
                              backgroundColor: accent.softBackground,
                              color: accent.softColor,
                            }}
                          >
                            {getModeLabel(result)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                            {result.ctaLabel}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                            {getMatchLabel(result)}
                          </span>
                        </div>

                        <h3 className="mt-4 font-headline text-2xl font-extrabold text-slate-950">
                          {result.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">{result.providerLabel}</p>
                        {result.matchExplanation ? (
                          <p className="mt-3 rounded-[1.2rem] bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                            {result.matchExplanation}
                          </p>
                        ) : null}

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                              Trajet
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                              {result.departure} -&gt; {result.destination}
                            </p>
                          </div>
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                              Depart
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                              {formatDateTime(result.departureAt, state.locale)}
                            </p>
                          </div>
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                              Duree
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                              {result.durationMinutes} min
                            </p>
                          </div>
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                              Disponibilite
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                              {result.mode === 'louage'
                                ? `${result.remainingSeats ?? 0} place(s)`
                                : result.lineCode ?? 'Ticket immediat'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <p className="font-headline text-3xl font-extrabold text-slate-950">
                          {formatTnd(result.priceTnd, state.locale)}
                        </p>
                        <button
                          type="button"
                          disabled={activeResultId === result.id}
                          onClick={() => void startCheckout(result)}
                          className="rounded-full px-5 py-3 text-sm font-bold text-white disabled:bg-slate-300"
                          style={{ backgroundImage: accent.solid }}
                        >
                          {activeResultId === result.id ? 'Preparation...' : result.ctaLabel}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : hasLoaded && !isSearching ? (
              <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <h2 className="font-headline text-2xl font-extrabold text-slate-950">
                  Aucun trajet correspondant
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Aucun bus, metro ou louage actif ne correspond exactement a cette combinaison de
                  depart, destination et date.
                </p>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                Sources backend
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>Bus et metro remontent depuis la collection Firestore des lignes tunisiennes.</p>
                <p>Les louages viennent des annonces publiees par les conducteurs verifies.</p>
                <p>Chaque resultat doit correspondre a votre depart et a votre destination.</p>
                <p>Le bouton de reservation ouvre le vrai checkout backend de l application.</p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                Tri metier
              </p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[1.4rem] bg-slate-50 p-4 text-sm text-slate-600">
                  Prix le plus bas compare les trois modes sans inventer de faux trajets.
                </div>
                <div className="rounded-[1.4rem] bg-slate-50 p-4 text-sm text-slate-600">
                  Trajet le plus rapide utilise la duree renvoyee par le backend.
                </div>
                <div className="rounded-[1.4rem] bg-slate-50 p-4 text-sm text-slate-600">
                  Depart le plus proche trie sur l horaire reel ou estime stocke dans les resultats.
                </div>
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
