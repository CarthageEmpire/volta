import { useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import { useVolta } from '../context/VoltaContext';
import { formatDateTime, formatTnd } from '../services/formatters';
import { Screen } from '../types';

interface DriverDashboardProps {
  navigate: (screen: Screen) => void;
}

function requestCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('La geolocalisation navigateur est indisponible sur cet appareil.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    });
  });
}

export default function DriverDashboard({ navigate }: DriverDashboardProps) {
  const {
    currentUser,
    state,
    toggleLiveSharing,
    cancelRide,
    markBookingAwaitingConfirmation,
    reportBookingNoShow,
  } = useVolta();
  const [feedback, setFeedback] = useState('');

  if (!currentUser) {
    return null;
  }

  const rides = state.louageRides.filter((ride) => ride.driverUserId === currentUser.id);
  const bookings = state.bookings.filter((booking) => booking.driverUserId === currentUser.id);
  const liveVehicle = state.liveVehicles.find((vehicle) => vehicle.operatorUserId === currentUser.id);
  const activeLine = state.lines.find((line) => line.id === currentUser.driverLineId);
  const activeRide = state.louageRides.find((ride) => ride.id === liveVehicle?.rideId);
  const isApproved = currentUser.verificationStatus === 'approved';
  const heldAmount = state.payments
    .filter((payment) => payment.payoutStatus === 'held')
    .filter((payment) => bookings.some((booking) => booking.paymentId === payment.id))
    .reduce((sum, payment) => sum + payment.amountTnd, 0);

  const updateLive = async (enabled: boolean) => {
    let location:
      | {
          latitude?: number;
          longitude?: number;
          accuracyMeters?: number;
        }
      | undefined;

    if (enabled) {
      try {
        const position = await requestCurrentPosition();
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        };
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : 'Impossible de recuperer la position GPS pour activer le live.',
        );
        return;
      }
    }

    const result = await toggleLiveSharing(enabled, location);
    setFeedback(result.message ?? (result.ok ? 'Statut live mis a jour.' : ''));
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar title="Console conducteur" subtitle="Verification, tracking et annonces" />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        {feedback && (
          <div className="rounded-[1.5rem] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            {feedback}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2.2rem] bg-[linear-gradient(135deg,_#0040a1_0%,_#0056d2_60%,_#7fb7ff_150%)] p-7 text-white shadow-[0_24px_70px_rgba(0,64,161,0.24)]">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/60">
              Verification
            </p>
            <h2 className="mt-4 font-headline text-4xl font-extrabold tracking-tight">
              {currentUser.verificationStatus}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/75">
              Les annonces et le live sharing restent bloques jusqu a l approbation admin.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('driver-verification')}
                className="rounded-full bg-white px-5 py-3 text-sm font-bold text-primary"
              >
                Gerer verification
              </button>
              <button
                type="button"
                onClick={() => navigate('create-trip')}
                className="rounded-full bg-white/10 px-5 py-3 text-sm font-bold text-white"
              >
                Publier un trajet
              </button>
            </div>
          </div>

          <div className="rounded-[2.2rem] bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
              Live tracking
            </p>
            <h3 className="mt-4 font-headline text-3xl font-extrabold text-slate-950">
              {activeLine
                ? `${activeLine.code} - ${activeLine.name}`
                : activeRide
                  ? `Louage ${activeRide.departureCity} - ${activeRide.destinationCity}`
                  : 'Aucune ligne ou annonce live'}
            </h3>
            <p className="mt-3 text-sm text-slate-500">
              {activeLine
                ? `Prochain arret: ${
                    liveVehicle
                      ? activeLine.stops.find((stop) => stop.id === liveVehicle.nextStopId)?.name ??
                        'Non determine'
                      : 'Non partage'
                  }`
                : activeRide
                  ? `Trajet actif: ${activeRide.departureCity} -> ${activeRide.destinationCity}`
                  : 'Le backend attend une position live depuis cet appareil.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void updateLive(true)}
                disabled={!isApproved}
                className={`rounded-full px-4 py-2 text-sm font-bold disabled:opacity-50 ${
                  liveVehicle?.sharingEnabled ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Activer live
              </button>
              <button
                type="button"
                onClick={() => void updateLive(false)}
                disabled={!isApproved}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50"
              >
                Desactiver
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Paiements retenus</p>
                <p className="mt-2 font-headline text-3xl font-extrabold text-slate-950">
                  {formatTnd(heldAmount, state.locale)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Position backend</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {liveVehicle?.latitude !== undefined && liveVehicle?.longitude !== undefined
                    ? `${liveVehicle.latitude.toFixed(4)}, ${liveVehicle.longitude.toFixed(4)}`
                    : 'Aucune coordonnee envoyee'}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {liveVehicle?.updatedAt
                    ? `Maj ${formatDateTime(liveVehicle.updatedAt, state.locale)}`
                    : 'Aucune mise a jour recente'}
                  {typeof liveVehicle?.accuracyMeters === 'number'
                    ? ` - precision ${Math.round(liveVehicle.accuracyMeters)} m`
                    : ''}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] bg-slate-50 p-4">
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  Note conducteur: {currentUser.rating?.toFixed(1) ?? 'N/A'}
                </span>
                <span>Trajets completes: {currentUser.completedTrips ?? 0}</span>
                <span>Penalites: {currentUser.penaltyCount ?? 0}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-2xl font-extrabold text-slate-950">
                Mes annonces
              </h3>
              <button
                type="button"
                onClick={() => navigate('create-trip')}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
              >
                Nouvelle annonce
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {rides.map((ride) => (
                <div key={ride.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    {ride.departureCity} -&gt; {ride.destinationCity}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {formatDateTime(ride.departureAt, state.locale)}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {ride.vehicleModel} - {ride.plateNumber} - {formatTnd(ride.priceTnd)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className="rounded-full bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      {ride.availableSeats}/{ride.totalSeats} places
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await cancelRide(ride.id);
                        setFeedback(result.message ?? '');
                      }}
                      className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h3 className="font-headline text-2xl font-extrabold text-slate-950">Reservations</h3>
            <div className="mt-5 space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    {booking.origin} -&gt; {booking.destination}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {formatDateTime(booking.departureAt, state.locale)}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {booking.status} - payout {booking.payoutStatus}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {booking.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const result = await markBookingAwaitingConfirmation(booking.id);
                          setFeedback(result.message ?? '');
                        }}
                        className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700"
                      >
                        Marquer arrive
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await reportBookingNoShow(booking.id);
                        setFeedback(result.message ?? '');
                      }}
                      className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700"
                    >
                      No-show
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
