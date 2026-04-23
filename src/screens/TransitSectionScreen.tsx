import { useMemo, useState } from 'react';
import LocationSelect from '../components/LocationSelect';
import TopAppBar from '../components/TopAppBar';
import TransportSectionTabs from '../components/TransportSectionTabs';
import { useVolta } from '../context/VoltaContext';
import { BUS_SEARCH_LOCATIONS, TUNIS_METRO_STATIONS } from '../data/locationOptions';
import { formatDateTime, formatTnd } from '../services/formatters';
import { rankTransitSectionLines } from '../services/sectionSearch';
import { validateLocationPair } from '../services/locationValidation';
import { Screen, SearchMatchType, TransportLine, TransportMode } from '../types';

interface TransitSectionScreenProps {
  mode: Extract<TransportMode, 'bus' | 'metro'>;
  navigate: (screen: Screen) => void;
}

const SECTION_CONFIG = {
  bus: {
    screen: 'bus' as const,
    title: 'Bus Tunisia',
    subtitle: 'Regular routes, live arrivals, and digital tickets',
    icon: 'directions_bus',
    accent: '#0040a1',
    accentSoft: 'rgba(0,64,161,0.12)',
    departureLabel: 'From city',
    destinationLabel: 'To city',
    placeholder: 'Select a city',
    searchLabel: 'Line search',
    queryPlaceholder: 'Ex: B32, Ariana, Marine',
    locationSearchPlaceholder: 'Search city',
    emptyLocationLabel: 'No matching city found.',
    validationType: 'ville' as const,
    locationOptions: BUS_SEARCH_LOCATIONS,
    defaultDeparture: '',
    defaultDestination: '',
    summaryTitle: 'Bus service',
    summaryItems: [
      'Validate mobile tickets before boarding.',
      'Track upcoming arrivals at key stops.',
      'See frequency and estimated duration before purchase.',
      'Open line details to view all stops.',
    ],
    sidebarTitle: 'Frequent lines',
    serviceHours: '05:30 - 21:30',
  },
  metro: {
    screen: 'metro' as const,
    title: 'Tunis Metro',
    subtitle: 'Lines, directions, and simple transfers',
    icon: 'tram',
    accent: '#0f766e',
    accentSoft: 'rgba(15,118,110,0.12)',
    departureLabel: 'From station',
    destinationLabel: 'To station',
    placeholder: 'Select a station',
    searchLabel: 'Line search',
    queryPlaceholder: 'Ex: M4, Bardo, Barcelone',
    locationSearchPlaceholder: 'Search station',
    emptyLocationLabel: 'No matching station found.',
    validationType: 'station' as const,
    locationOptions: TUNIS_METRO_STATIONS,
    defaultDeparture: '',
    defaultDestination: '',
    summaryTitle: 'Metro service',
    summaryItems: [
      'See directions and terminus on each line card.',
      'View arrivals and transfer points at major stations.',
      'Buy a ticket directly from your selected line.',
      'Line colors stay consistent between list and details.',
    ],
    sidebarTitle: 'Major stations',
    serviceHours: '05:00 - 22:30',
  },
} as const;

function validateOptionalLocationPair(
  departure: string,
  destination: string,
  type: 'ville' | 'station' | 'lieu',
) {
  if (!departure || !destination) {
    return '';
  }

  return validateLocationPair(departure, destination, type);
}

function getMatchChipLabel(matchType: SearchMatchType) {
  switch (matchType) {
    case 'direct':
      return 'Direct trip';
    case 'departure_area':
      return 'Near departure';
    case 'destination_area':
      return 'Near destination';
    case 'network_suggestion':
    default:
      return 'Suggested option';
  }
}

function getMajorStops(line: TransportLine) {
  const highlighted = line.stops.filter((stop) => stop.isMajor);
  return (highlighted.length > 0 ? highlighted : line.stops).slice(0, 4);
}

export default function TransitSectionScreen({ mode, navigate }: TransitSectionScreenProps) {
  const { state, setLine, startLinePayment } = useVolta();
  const config = SECTION_CONFIG[mode];
  const [filters, setFilters] = useState({
    departure: config.defaultDeparture,
    destination: config.defaultDestination,
    query: '',
  });
  const [showValidation, setShowValidation] = useState(false);

  const validationMessage = showValidation
    ? validateOptionalLocationPair(filters.departure, filters.destination, config.validationType)
    : '';

  const availableLines = useMemo(
    () => state.lines.filter((line) => line.mode === mode),
    [mode, state.lines],
  );

  const lines = useMemo(
    () => rankTransitSectionLines(availableLines, filters, mode),
    [availableLines, filters, mode],
  );

  const sidebarLines = useMemo(
    () => lines.slice(0, 4).map((item) => item.line),
    [lines],
  );

  const openLine = (lineId: string) => {
    setLine(lineId);
    navigate('line-details');
  };

  const buyTicket = async (lineId: string) => {
    const result = await startLinePayment(lineId);
    if (result.ok) {
      navigate('payment');
    }
  };

  const updateDeparture = (departure: string) => {
    setShowValidation(false);
    setFilters((current) => ({
      ...current,
      departure,
      destination: current.destination === departure ? '' : current.destination,
    }));
  };

  const updateDestination = (destination: string) => {
    setShowValidation(false);
    setFilters((current) => ({
      ...current,
      destination,
      departure: current.departure === destination ? '' : current.departure,
    }));
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar title={config.title} subtitle={config.subtitle} onBack={() => navigate('explore')} />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <TransportSectionTabs current={config.screen} navigate={navigate} />

        <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-4 md:grid-cols-4">
            <LocationSelect
              label={config.departureLabel}
              placeholder={config.placeholder}
              value={filters.departure}
              options={config.locationOptions}
              searchPlaceholder={config.locationSearchPlaceholder}
              emptyStateLabel={config.emptyLocationLabel}
              excludedValue={filters.destination || undefined}
              invalid={Boolean(validationMessage)}
              onChange={updateDeparture}
            />
            <LocationSelect
              label={config.destinationLabel}
              placeholder={config.placeholder}
              value={filters.destination}
              options={config.locationOptions}
              searchPlaceholder={config.locationSearchPlaceholder}
              emptyStateLabel={config.emptyLocationLabel}
              excludedValue={filters.departure || undefined}
              invalid={Boolean(validationMessage)}
              onChange={updateDestination}
            />
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>{config.searchLabel}</span>
              <input
                value={filters.query}
                onChange={(event) => {
                  setShowValidation(false);
                  setFilters((current) => ({ ...current, query: event.target.value }));
                }}
                className="rounded-[1.4rem] border border-slate-200 bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                placeholder={config.queryPlaceholder}
                type="text"
              />
            </label>
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => setShowValidation(true)}
                className="rounded-[1.4rem] px-5 py-4 text-sm font-bold text-white"
                style={{ backgroundColor: config.accent }}
              >
                Search
              </button>
            </div>
          </div>

          {validationMessage ? (
            <p className="mt-4 text-sm font-medium text-red-600">{validationMessage}</p>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {lines.length > 0 ? (
              lines.map((result) => {
                const line = result.line;
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
                            {line.stops.length} stops
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                            {getMatchChipLabel(result.matchType)}
                          </span>
                        </div>

                        <h2 className="mt-4 font-headline text-2xl font-extrabold text-slate-950">
                          {line.origin} -&gt; {line.destination}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{line.routeLabel}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          {line.operatorName ?? 'Operator not listed'}
                        </p>
                        {line.servicePattern && (
                          <p className="mt-1 text-sm text-slate-500">{line.servicePattern}</p>
                        )}
                        <p className="mt-3 rounded-[1.2rem] bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                          {result.matchExplanation}
                        </p>
                        {line.verificationNotes && (
                          <p className="mt-1 text-xs leading-5 text-amber-700">
                            {line.verificationNotes}
                          </p>
                        )}

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                              {mode === 'bus' ? 'Next departure' : 'Service hours'}
                            </p>
                            <p className="mt-2 font-headline text-xl font-extrabold text-slate-950">
                              {mode === 'bus' ? line.stops[0]?.plannedTime ?? '--:--' : config.serviceHours}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {mode === 'bus' ? `From ${line.origin}` : `To ${line.destination}`}
                            </p>
                          </div>
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                              Frequency
                            </p>
                            <p className="mt-2 font-headline text-xl font-extrabold text-slate-950">
                              {line.intervalMinutes} min
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {vehicle && nextStop
                                ? `${vehicle.label} arrives at ${nextStop.name} in ${vehicle.etaMinutes} min`
                                : 'Live tracking is available in line details'}
                            </p>
                            {vehicle?.updatedAt ? (
                              <p className="mt-2 text-xs text-slate-500">
                                Backend update {formatDateTime(vehicle.updatedAt, state.locale)}
                              </p>
                            ) : null}
                          </div>
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                              Estimated duration
                            </p>
                            <p className="mt-2 font-headline text-xl font-extrabold text-slate-950">
                              {line.durationMinutes} min
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {mode === 'bus'
                                ? 'Key stops shown below'
                                : 'Key stations and simple transfers'}
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
                            Fare
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
                            View line
                          </button>
                          <button
                            type="button"
                            onClick={() => void buyTicket(line.id)}
                            className="rounded-full px-5 py-3 text-sm font-bold text-white"
                            style={{ backgroundColor: config.accent }}
                          >
                            Buy ticket
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
                      No active backend lines
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      No active {mode === 'bus' ? 'bus' : 'metro'} lines are currently available.
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
                          {line.intervalMinutes} min - {line.stops.length} stops
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-slate-400">
                        arrow_forward
                      </span>
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
