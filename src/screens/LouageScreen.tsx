import { useMemo, useState } from 'react';
import LocationSelect from '../components/LocationSelect';
import TopAppBar from '../components/TopAppBar';
import TransportSectionTabs from '../components/TransportSectionTabs';
import { useVolta } from '../context/VoltaContext';
import { LOUAGE_SEARCH_LOCATIONS } from '../data/locationOptions';
import { formatDateTime, formatTnd } from '../services/formatters';
import { rankLouageSectionRides } from '../services/sectionSearch';
import { validateLocationPair } from '../services/locationValidation';
import { Screen, SearchMatchType } from '../types';

interface LouageScreenProps {
  navigate: (screen: Screen) => void;
}

function validateOptionalLocationPair(departure: string, destination: string) {
  if (!departure || !destination) {
    return '';
  }

  return validateLocationPair(departure, destination, 'ville');
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

export default function LouageScreen({ navigate }: LouageScreenProps) {
  const { state, startLouagePayment } = useVolta();
  const [filters, setFilters] = useState({
    departure: '',
    destination: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [showValidation, setShowValidation] = useState(false);

  const validationMessage = showValidation
    ? validateOptionalLocationPair(filters.departure, filters.destination)
    : '';

  const rides = useMemo(
    () => rankLouageSectionRides(state.louageRides, filters),
    [filters, state.louageRides],
  );

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
      <TopAppBar
        title="Louage Tunisia"
        subtitle="Intercity booking with payment and trip rules"
        onBack={() => navigate('explore')}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <TransportSectionTabs current="louage" navigate={navigate} />

        <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-4 md:grid-cols-4">
            <LocationSelect
              label="From city"
              placeholder="Select a city"
              value={filters.departure}
              options={LOUAGE_SEARCH_LOCATIONS}
              searchPlaceholder="Search city"
              emptyStateLabel="No matching city found."
              excludedValue={filters.destination || undefined}
              invalid={Boolean(validationMessage)}
              onChange={updateDeparture}
            />
            <LocationSelect
              label="To city"
              placeholder="Select a city"
              value={filters.destination}
              options={LOUAGE_SEARCH_LOCATIONS}
              searchPlaceholder="Search city"
              emptyStateLabel="No matching city found."
              excludedValue={filters.departure || undefined}
              invalid={Boolean(validationMessage)}
              onChange={updateDestination}
            />
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Date</span>
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
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => setShowValidation(true)}
                className="rounded-[1.4rem] bg-[linear-gradient(135deg,_#0040a1_0%,_#006d36_160%)] px-5 py-4 text-sm font-bold text-white"
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
            {rides.length > 0 ? (
              rides.map((result) => {
                const ride = result.ride;
                const driver = state.users.find((user) => user.id === ride.driverUserId);
                return (
                  <article
                    key={ride.id}
                    className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-[rgba(0,109,54,0.12)] px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#006d36]">
                            Louage
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                            {ride.availableSeats}/{ride.totalSeats} seats
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                            {getMatchChipLabel(result.matchType)}
                          </span>
                          {driver?.rating ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                              Rating {driver.rating.toFixed(1)}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-4 font-headline text-2xl font-extrabold text-slate-950">
                          {ride.departureCity} -&gt; {ride.destinationCity}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          Driver: {ride.driverName ?? driver?.fullName ?? 'Volta driver'}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {ride.vehicleModel} - {ride.plateNumber}
                        </p>
                        <p className="mt-3 rounded-[1.2rem] bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                          {result.matchExplanation}
                        </p>
                        <div className="mt-5 grid gap-3 md:grid-cols-4">
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                              Departure
                            </p>
                            <p className="mt-2 font-headline text-xl font-extrabold text-slate-950">
                              {formatDateTime(ride.departureAt)}
                            </p>
                          </div>
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                              Vehicle
                            </p>
                            <p className="mt-2 font-headline text-xl font-extrabold text-slate-950">
                              {ride.vehicleModel}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">{ride.plateNumber}</p>
                          </div>
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                              Availability
                            </p>
                            <p className="mt-2 font-headline text-xl font-extrabold text-slate-950">
                              {ride.availableSeats} seats
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Payment held until trip confirmation
                            </p>
                          </div>
                          <div className="rounded-[1.4rem] bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                              Driver stats
                            </p>
                            <p className="mt-2 font-headline text-xl font-extrabold text-slate-950">
                              {driver?.completedTrips ?? 0} trips
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {driver?.penaltyCount ?? 0} penalty(ies)
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <p className="font-headline text-3xl font-extrabold text-slate-950">
                          {formatTnd(ride.priceTnd)}
                        </p>
                        <button
                          type="button"
                          disabled={ride.availableSeats < 1}
                          onClick={async () => {
                            const result = await startLouagePayment(ride.id);
                            if (result.ok) {
                              navigate('payment');
                            }
                          }}
                          className="rounded-full bg-[linear-gradient(135deg,_#006d36_0%,_#0f9d58_100%)] px-5 py-3 text-sm font-bold text-white disabled:bg-slate-300"
                        >
                          Book now
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <h2 className="font-headline text-2xl font-extrabold text-slate-950">
                  No active louage rides
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  No bookable louage listings are currently available.
                </p>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Rules</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>Passenger cancellations are refundable up to 2 hours before departure.</p>
                <p>Driver cancellation within 1 hour: full refund plus 10% penalty.</p>
                <p>Driver payout is held until passenger confirms trip completion.</p>
                <p>Passenger no-show can only be charged with live proof.</p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                Popular routes
              </p>
              <div className="mt-4 grid gap-3">
                {['Tunis -> Sousse', 'Sousse -> Sfax', 'Tunis -> Nabeul', 'Monastir -> Sfax'].map((route) => (
                  <div
                    key={route}
                    className="rounded-[1.4rem] bg-slate-50 px-4 py-3 font-semibold text-slate-700"
                  >
                    {route}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
