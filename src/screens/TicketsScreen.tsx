import { useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import TicketQrCode from '../components/TicketQrCode';
import { useVolta } from '../context/VoltaContext';
import { formatDateTime, formatTnd } from '../services/formatters';
import { Screen } from '../types';

interface TicketsScreenProps {
  navigate: (screen: Screen) => void;
}

export default function TicketsScreen({ navigate }: TicketsScreenProps) {
  const { currentUser, state, cancelBooking, confirmBookingCompletion } = useVolta();
  const [feedback, setFeedback] = useState('');

  if (!currentUser) {
    return null;
  }

  const tickets = state.tickets.filter((ticket) => ticket.userId === currentUser.id);
  const activeTickets = tickets.filter((ticket) => ticket.status === 'active');
  const pastTickets = tickets.filter((ticket) => ticket.status !== 'active');
  const louageBookings = state.bookings.filter(
    (booking) => booking.passengerUserId === currentUser.id && booking.mode === 'louage',
  );
  const payments = state.payments
    .filter((payment) => payment.userId === currentUser.id)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar
        title="Tickets et QR"
        subtitle="Titres actifs, historique et confirmations louage"
        onBack={() => navigate('explore')}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        {feedback && (
          <div className="rounded-[1.5rem] bg-white p-4 text-sm font-semibold text-slate-700 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            {feedback}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-3xl font-extrabold text-slate-950">Tickets actifs</h2>
              <button
                type="button"
                onClick={() => navigate('line-details')}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
              >
                Acheter
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {activeTickets.length > 0 ? (
                activeTickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-[1.6rem] bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <TicketQrCode payload={ticket.qrPayload} />
                      <div>
                        <p className="font-headline text-2xl font-extrabold text-slate-950">
                          {ticket.title}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Valide jusqu&apos;a {formatDateTime(ticket.validUntil, state.locale)}
                        </p>
                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          {formatTnd(ticket.priceTnd, state.locale)} - {ticket.zones}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-500">
                  Aucun ticket actif.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h2 className="font-headline text-3xl font-extrabold text-slate-950">Louage</h2>
            <div className="mt-5 space-y-4">
              {louageBookings.length > 0 ? (
                louageBookings.map((booking) => (
                  <div key={booking.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                    <p className="font-bold text-slate-900">
                      {booking.origin} -&gt; {booking.destination}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDateTime(booking.departureAt, state.locale)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {booking.status} - {booking.refundStatus ?? 'none'}
                    </p>
                    {booking.note && <p className="mt-2 text-sm text-slate-500">{booking.note}</p>}
                    <div className="mt-4 flex flex-wrap gap-3">
                      {booking.status === 'awaiting_passenger_confirmation' && (
                        <button
                          type="button"
                          onClick={async () => {
                            const result = await confirmBookingCompletion(booking.id);
                            setFeedback(result.message ?? '');
                          }}
                          className="rounded-full bg-secondary px-4 py-2 text-sm font-bold text-white"
                        >
                          Confirmer trajet
                        </button>
                      )}
                      {['confirmed', 'awaiting_passenger_confirmation'].includes(booking.status) && (
                        <button
                          type="button"
                          onClick={async () => {
                            const result = await cancelBooking(booking.id);
                            setFeedback(result.message ?? '');
                          }}
                          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-500">
                  Aucune reservation louage.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Historique</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {pastTickets.length > 0 ? (
              pastTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-[1.4rem] bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">{ticket.title}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {formatDateTime(ticket.validFrom, state.locale)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] bg-slate-50 p-4 text-sm text-slate-500">
                Pas encore d'historique archive.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                Paiements
              </p>
              <h2 className="mt-2 font-headline text-3xl font-extrabold text-slate-950">
                Historique backend
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              {payments.length} paiement(s)
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {payments.length > 0 ? (
              payments.map((payment) => {
                const relatedBooking = state.bookings.find((booking) => booking.id === payment.bookingId);
                return (
                  <div key={payment.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                        {payment.provider}
                      </span>
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                        {payment.status}
                      </span>
                    </div>
                    <p className="mt-4 font-bold text-slate-900">{payment.summary}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDateTime(payment.createdAt, state.locale)}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Payout: {payment.payoutStatus}
                      {relatedBooking ? ` - Reservation ${relatedBooking.status}` : ''}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-700">
                        Ref: {payment.providerReference ?? payment.id}
                      </span>
                      <span className="font-headline text-2xl font-extrabold text-slate-950">
                        {formatTnd(payment.amountTnd, state.locale)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-500">
                Aucun paiement enregistre pour ce compte.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
