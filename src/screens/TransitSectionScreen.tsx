import { useMemo, useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import TransportSectionTabs from '../components/TransportSectionTabs';
import { useVolta } from '../context/VoltaContext';
import { formatTnd } from '../services/formatters';
import { Screen, TransportLine, TransportMode } from '../types';

interface TransitSectionScreenProps {
  mode: Extract<TransportMode, 'bus' | 'metro'>;
  navigate: (screen: Screen) => void;
}

const SECTION_CONFIG = {
  bus: {
    screen: 'bus' as const,
    title: 'Bus Tunisie',
    subtitle: 'Lignes regulieres, passages et billets digitaux',
    icon: 'directions_bus',
    accent: '#0040a1',
    accentSoft: 'rgba(0,64,161,0.12)',
    departureLabel: 'Arret depart',
    destinationLabel: 'Arret arrivee',
    queryLabel: 'Numero ou axe',
    defaultDeparture: 'Passage',
    defaultDestination: '',
    searchPlaceholder: 'Ex: B32, Ariana, Marine',
    summaryTitle: 'Service bus',
    summaryItems: [
      'Validation ticket mobile avant montee a bord.',
      'Suivi des prochains passages sur les arrets majeurs.',
      'Frequence et duree estimee visibles avant achat.',
      'Basculer vers le detail ligne pour voir tous les arrets.',
    ],
    sidebarTitle: 'Lignes frequentes',
    serviceHours: '05:30 - 21:30',
  },
  metro: {
    screen: 'metro' as const,
    title: 'Metro Tunis',
    subtitle: 'Lignes, directions et correspondances simplifiees',
    icon: 'tram',
    accent: '#0f766e',
    accentSoft: 'rgba(15,118,110,0.12)',
    departureLabel: 'Station depart',
    destinationLabel: 'Station arrivee',
    queryLabel: 'Ligne ou station',
    defaultDeparture: 'Tunis Marine',
    defaultDestination: '',
    searchPlaceholder: 'Ex: M4, Bardo, Barcelone',
    summaryTitle: 'Service metro',
    summaryItems: [
      'Directions et terminus visibles sur chaque carte.',
      'Temps de passage et correspondances sur les stations majeures.',
      'Achat ticket en un geste depuis la ligne souhaitee.',
      'Couleur de ligne preservee entre liste et detail.',
    ],
    sidebarTitle: 'Stations majeures',
    serviceHours: '05:00 - 22:30',
  },
} as const;

function matchesLine(line: TransportLine, filters: { departure: string; destination: string; query: string }) {
  const departure = filters.departure.trim().toLowerCase();
  const destination = filters.destination.trim().toLowerCase();
  const query = filters.query.trim().toLowerCase();
  const stopNames = line.stops.map((stop) => stop.name.toLowerCase());

  const matchesDeparture =
    departure.length === 0 ||
    line.origin.toLowerCase().includes(departure) ||
    stopNames.some((stop) => stop.includes(departure));
  const matchesDestination =
    destination.length === 0 ||
    line.destination.toLowerCase().includes(destination) ||
    stopNames.some((stop) => stop.includes(destination));
  const matchesQuery =
    query.length === 0 ||
    line.code.toLowerCase().includes(query) ||
    line.name.toLowerCase().includes(query) ||
    line.routeLabel.toLowerCase().includes(query) ||
    stopNames.some((stop) => stop.includes(query));

  return matchesDeparture && matchesDestination && matchesQuery;
}

function getMajorStops(line: TransportLine) {
  const highlighted = line.stops.filter((stop) => stop.isMajor);
  return (highlighted.length > 0 ? highlighted : line.stops).slice(0, 4);
}

export default function TransitSectionScreen({
  mode,
  navigate,
}: TransitSectionScreenProps) {
  const { state, setLine, startLinePayment } = useVolta();
  const config = SECTION_CONFIG[mode];
  const [filters, setFilters] = useState({
    departure: config.defaultDeparture,
    destination: config.defaultDestination,
    query: '',
  });

  const lines = useMemo(
    () => state.lines.filter((line) => line.mode === mode && matchesLine(line, filters)),
    [filters, mode, state.lines],
  );

  const sidebarLines = useMemo(
    () => state.lines.filter((line) => line.mode === mode).slice(0, 4),
    [mode, state.lines],
  );

  const openLine = (lineId: string) => {
    setLine(lineId);
    navigate('line-details');
  };

  const buyTicket = (lineId: string) => {
    const result = startLinePayment(lineId);
    if (result.ok) {
      navigate('payment');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar title={config.title} subtitle={config.subtitle} onBack={() => navigate('explore')} />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <TransportSectionTabs current={config.screen} navigate={navigate} />

        <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>{config.departureLabel}</span>
              <input
                value={filters.departure}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, departure: event.target.value }))
                }
                className="rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                placeholder={config.departureLabel}
                type="text"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>{config.destinationLabel}</span>
              <input
                value={filters.destination}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, destination: event.target.value }))
                }
                className="rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                placeholder={config.destinationLabel}
                type="text"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>{config.queryLabel}</span>
              <input
                value={filters.query}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, query: event.target.value }))
                }
                className="rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                placeholder={config.searchPlaceholder}
                type="text"
              />
            </label>
            <div className="flex flex-col justify-end">
              <button
                type="button"
                className="rounded-[1.4rem] px-5 py-4 text-sm font-bold text-white"
                style={{ backgroundColor: config.accent }}
              >
                Rechercher
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {lines.length > 0 ? (
              lines.map((line) => {
                const vehicle = state.liveVehicles.find(
                  (candidate) => candidate.lineId === line.id && candidate.sharingEnabled,
                );
                const nextStop = line.stops.find((stop) => stop.id === vehicle?.nextStopId);
                const primaryStops = getMajorStops(line);

                return (
                  <article
                    key={line.id}
                    className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.22em]"
                            style={{
                              backgroundColor: line.color,
                              color: '#ffffff',
                            }}
                          >
                            {mode === 'bus' ? 'Bus' : 'Metro'} {line.code}
                          </span>
                          <span
                            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.22em]"
                            style={{
                              backgroundColor: config.accentSoft,
                              color: config.accent,
                            }}
                          >
                            {line.stops.length} arrets
                          </span>
                        </div>

                        <h2 className="mt-4 font-headline text-2xl font-extrabold text-slate-950">
                          {line.origin} -&gt; {line.destination}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{line.routeLabel}</p>

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                              {mode === 'bus' ? 'Prochain depart' : 'Service'}
                            </p>
                            <p className="mt-2 font-headline text-xl font-extrabold text-slate-950">
                              {mode === 'bus' ? line.stops[0]?.plannedTime ?? '--:--' : config.serviceHours}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {mode === 'bus'
                                ? `Depuis ${line.origin}`
                                : `Vers ${line.destination}`}
                            </p>
                          </div>
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                              Frequence
                            </p>
                            <p className="mt-2 font-headline text-xl font-extrabold text-slate-950">
                              {line.intervalMinutes} min
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {vehicle && nextStop
                                ? `${vehicle.label} arrive a ${nextStop.name} dans ${vehicle.etaMinutes} min`
                                : 'Suivi live disponible sur le detail ligne'}
                            </p>
                          </div>
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                              Duree estimee
                            </p>
                            <p className="mt-2 font-headline text-xl font-extrabold text-slate-950">
                              {line.durationMinutes} min
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {mode === 'bus'
                                ? 'Arrets principaux visibles ci-dessous'
                                : 'Stations clefs et correspondances simplifiees'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          {primaryStops.map((stop) => (
                            <span
                              key={stop.id}
                              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                            >
                              {stop.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <div className="rounded-[1.4rem] bg-slate-50 px-4 py-3 text-right">
                          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                            Tarif
                          </p>
                          <p className="mt-1 font-headline text-3xl font-extrabold text-slate-950">
                            {formatTnd(line.fareTnd)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3 lg:justify-end">
                          <button
                            type="button"
                            onClick={() => openLine(line.id)}
                            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
                          >
                            Voir ligne
                          </button>
                          <button
                            type="button"
                            onClick={() => buyTicket(line.id)}
                            className="rounded-full px-5 py-3 text-sm font-bold text-white"
                            style={{ backgroundColor: config.accent }}
                          >
                            Acheter ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] text-white"
                    style={{ backgroundColor: config.accent }}
                  >
                    <span className="material-symbols-outlined">{config.icon}</span>
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl font-extrabold text-slate-950">
                      Aucun resultat pour ce filtre
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Ajustez le depart, la destination ou la recherche de ligne pour afficher
                      les services {mode === 'bus' ? 'bus' : 'metro'} disponibles.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                {config.summaryTitle}
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                {config.summaryItems.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                  {config.sidebarTitle}
                </p>
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]"
                  style={{ backgroundColor: config.accentSoft, color: config.accent }}
                >
                  {config.serviceHours}
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {sidebarLines.map((line) => (
                  <button
                    key={line.id}
                    type="button"
                    onClick={() => openLine(line.id)}
                    className="rounded-[1.4rem] bg-slate-50 px-4 py-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {line.code} - {line.origin} -&gt; {line.destination}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {line.intervalMinutes} min - {line.stops.length} arrets
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
