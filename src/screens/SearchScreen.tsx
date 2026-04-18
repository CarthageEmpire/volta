import { useMemo, useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import { useVolta } from '../context/VoltaContext';
import { formatDateTime, formatTnd } from '../services/formatters';
import { Screen, SearchFilters, SearchSort } from '../types';

interface SearchScreenProps {
  navigate: (screen: Screen) => void;
}

export default function SearchScreen({ navigate }: SearchScreenProps) {
  const { searchTransport, setLine, startLinePayment, startLouagePayment } = useVolta();
  const [feedback, setFeedback] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    departure: 'Tunis',
    destination: 'Sousse',
    date: new Date().toISOString().slice(0, 10),
    sortBy: 'cheapest',
  });

  const results = useMemo(() => searchTransport(filters), [filters, searchTransport]);

  const openCheckout = (sourceId: string, mode: string) => {
    const result =
      mode === 'louage' ? startLouagePayment(sourceId) : startLinePayment(sourceId);
    if (result.ok) {
      navigate('payment');
      return;
    }
    setFeedback(result.message ?? 'Action indisponible.');
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar
        title="Recherche intelligente"
        subtitle="Comparateur metro, bus et louage"
        onBack={() => navigate('explore')}
      />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
        {feedback && (
          <div className="rounded-[1.5rem] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            {feedback}
          </div>
        )}

        <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-4 md:grid-cols-4">
            <input
              value={filters.departure}
              onChange={(event) =>
                setFilters((current) => ({ ...current, departure: event.target.value }))
              }
              className="rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
              placeholder="Depart"
              type="text"
            />
            <input
              value={filters.destination}
              onChange={(event) =>
                setFilters((current) => ({ ...current, destination: event.target.value }))
              }
              className="rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
              placeholder="Destination"
              type="text"
            />
            <input
              value={filters.date}
              onChange={(event) =>
                setFilters((current) => ({ ...current, date: event.target.value }))
              }
              className="rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
              type="date"
            />
            <select
              value={filters.sortBy}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  sortBy: event.target.value as SearchSort,
                }))
              }
              className="rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
            >
              <option value="cheapest">Moins cher</option>
              <option value="duration">Plus rapide</option>
              <option value="departure">Depart le plus proche</option>
            </select>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-slate-950">
              Resultats combines
            </h2>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              {results.length} options
            </span>
          </div>

          {results.length > 0 ? (
            results.map((result) => (
              <article
                key={result.id}
                className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-headline text-2xl font-extrabold text-slate-950">
                        {result.title}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                        {result.mode}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {result.departure} -&gt; {result.destination}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {formatDateTime(result.departureAt)} - {result.durationMinutes} min
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{result.providerLabel}</p>
                  </div>

                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <p className="font-headline text-3xl font-extrabold text-slate-950">
                      {formatTnd(result.priceTnd)}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {result.mode !== 'louage' && (
                        <button
                          type="button"
                          onClick={() => {
                            setLine(result.sourceId);
                            navigate('line-details');
                          }}
                          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
                        >
                          Voir ligne
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openCheckout(result.sourceId, result.mode)}
                        className="rounded-full bg-[linear-gradient(135deg,_#0040a1_0%,_#006d36_160%)] px-5 py-3 text-sm font-bold text-white"
                      >
                        {result.ctaLabel}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[2rem] bg-white p-8 text-sm text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              Aucun resultat ne correspond a votre recherche.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
