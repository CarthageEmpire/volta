import TopAppBar from '../components/TopAppBar';
import TicketQrCode from '../components/TicketQrCode';
import { useVolta } from '../context/VoltaContext';
import { formatDateTime, formatTnd } from '../services/formatters';
import { Screen } from '../types';

interface ExploreScreenProps {
  navigate: (screen: Screen) => void;
}

export default function ExploreScreen({ navigate }: ExploreScreenProps) {
  const { currentUser, state, toggleNearbyLocation } = useVolta();

  if (!currentUser) {
    return null;
  }

  const bookings = state.bookings.filter((booking) => booking.passengerUserId === currentUser.id);
  const upcoming = bookings.filter((booking) =>
    ['confirmed', 'awaiting_passenger_confirmation'].includes(booking.status),
  );
  const activeTicket = state.tickets.find(
    (ticket) => ticket.userId === currentUser.id && ticket.status === 'active',
  );
  const favorites = state.favorites.filter((favorite) => favorite.userId === currentUser.id);

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar title="Volta" subtitle="Passenger dashboard" />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2.2rem] bg-[linear-gradient(135deg,_#0040a1_0%,_#0056d2_60%,_#7fb7ff_150%)] p-8 text-white shadow-[0_24px_70px_rgba(0,64,161,0.24)]">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">
              Hi {currentUser.fullName.split(' ')[0]}
            </p>
            <h2 className="mt-4 font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
              All your
              <br />
              transport in one
              <br />
              dashboard.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
              Search trips, track live lines, open your QR ticket, and book a louage ride in one
              place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('search')}
                className="rounded-full bg-white px-5 py-3 text-sm font-bold text-primary"
              >
                Smart search
              </button>
              <button
                type="button"
                onClick={() => navigate('line-details')}
                className="rounded-full bg-white/10 px-5 py-3 text-sm font-bold text-white"
              >
                Live lines
              </button>
            </div>
          </div>

          <div className="rounded-[2.2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Active ticket</p>
            {activeTicket ? (
              <div className="mt-4 flex flex-col items-center gap-4">
                <TicketQrCode payload={activeTicket.qrPayload} />
                <div className="w-full rounded-[1.5rem] bg-slate-50 p-4">
                  <p className="font-headline text-xl font-extrabold text-slate-950">
                    {activeTicket.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Valid until {formatDateTime(activeTicket.validUntil, state.locale)}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    {formatTnd(activeTicket.priceTnd, state.locale)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-500">
                No active ticket yet.
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-2xl font-extrabold text-slate-950">
                Upcoming bookings
              </h3>
              <button
                type="button"
                onClick={() => navigate('louage')}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
              >
                View louage
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {upcoming.length > 0 ? (
                upcoming.map((booking) => (
                  <div key={booking.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                    <p className="font-bold text-slate-900">
                      {booking.origin} -&gt; {booking.destination}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDateTime(booking.departureAt, state.locale)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {booking.mode} - {formatTnd(booking.amountTnd, state.locale)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-500">
                  No upcoming bookings.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-2xl font-extrabold text-slate-950">
                Nearby
              </h3>
              <button
                type="button"
                onClick={toggleNearbyLocation}
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  state.locationEnabled ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {state.locationEnabled ? 'Location on' : 'Turn on'}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {state.locationEnabled ? (
                state.nearbyTransport.map((item) => (
                  <div key={item.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      {item.distanceMeters} m - {item.mode}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-500">
                  Turn on location to see transport options within 500 m.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                  Travel modes
                </p>
                <h3 className="mt-2 font-headline text-2xl font-extrabold text-slate-950">
                  Access Louage, Bus, and Metro in one flow
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
                3 connected sections
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                {
                  screen: 'louage' as const,
                  title: 'Louage',
                  subtitle: 'Intercity rides, seats, and rules',
                  icon: 'route',
                  accent: 'bg-[rgba(0,109,54,0.12)] text-[#006d36]',
                },
                {
                  screen: 'bus' as const,
                  title: 'Bus',
                  subtitle: 'Routes, stops, frequency, and tickets',
                  icon: 'directions_bus',
                  accent: 'bg-[rgba(0,64,161,0.12)] text-[#0040a1]',
                },
                {
                  screen: 'metro' as const,
                  title: 'Metro',
                  subtitle: 'Lines, stops, directions, and times',
                  icon: 'tram',
                  accent: 'bg-[rgba(15,118,110,0.12)] text-[#0f766e]',
                },
              ].map((item) => (
                <button
                  key={item.screen}
                  type="button"
                  onClick={() => navigate(item.screen)}
                  className="rounded-[1.6rem] bg-slate-50 p-5 text-left"
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-[1.1rem] ${item.accent}`}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </span>
                  <p className="mt-4 font-headline text-2xl font-extrabold text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.subtitle}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Favorites</p>
            <div className="mt-4 grid gap-3">
              {favorites.map((favorite) => (
                <div key={favorite.id} className="rounded-[1.4rem] bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">{favorite.label}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {favorite.city} - {favorite.hint}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
              Quick actions
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate('search')}
                className="rounded-[1.4rem] bg-slate-50 p-5 text-left font-semibold text-slate-800"
              >
                Compare metro, bus, and louage
              </button>
              <button
                type="button"
                onClick={() => navigate('line-details')}
                className="rounded-[1.4rem] bg-slate-50 p-5 text-left font-semibold text-slate-800"
              >
                Track lines in real time
              </button>
              <button
                type="button"
                onClick={() => navigate('louage')}
                className="rounded-[1.4rem] bg-slate-50 p-5 text-left font-semibold text-slate-800"
              >
                Book an intercity louage
              </button>
              <button
                type="button"
                onClick={() => navigate('tickets')}
                className="rounded-[1.4rem] bg-slate-50 p-5 text-left font-semibold text-slate-800"
              >
                View my QR codes
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
