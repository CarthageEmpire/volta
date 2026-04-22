import { onCall } from 'firebase-functions/v2/https';
import { adminDb } from '../lib/firebase.js';
import { normalizeText, requireRole } from '../lib/helpers.js';
import { searchTransportSchema } from '../schemas.js';

export const searchTransport = onCall(async (request) => {
  requireRole(request, ['passenger', 'driver', 'admin']);
  const filters = searchTransportSchema.parse(request.data);
  const normalizedDeparture = normalizeText(filters.departure).toLowerCase();
  const normalizedDestination = normalizeText(filters.destination).toLowerCase();

  const [linesSnapshot, ridesSnapshot] = await Promise.all([
    adminDb.collection('lines').get(),
    adminDb.collection('rides').get(),
  ]);

  const lineResults = linesSnapshot.docs
    .map((doc) => doc.data())
    .filter((line) => {
      const stops = Array.isArray(line.stops) ? line.stops : [];
      const matchesDeparture =
        normalizedDeparture.length === 0 ||
        String(line.origin).toLowerCase().includes(normalizedDeparture) ||
        stops.some((stop: { name?: string }) =>
          String(stop.name ?? '').toLowerCase().includes(normalizedDeparture),
        );
      const matchesDestination =
        normalizedDestination.length === 0 ||
        String(line.destination).toLowerCase().includes(normalizedDestination) ||
        String(line.routeLabel).toLowerCase().includes(normalizedDestination) ||
        stops.some((stop: { name?: string }) =>
          String(stop.name ?? '').toLowerCase().includes(normalizedDestination),
        );

      return matchesDeparture && matchesDestination;
    })
    .map((line) => {
      const departureAt = new Date();
      departureAt.setMinutes(departureAt.getMinutes() + 20);
      return {
        id: `${line.id}-search`,
        sourceId: line.id,
        mode: line.mode,
        title: `${line.name} ${line.code}`,
        departure: line.origin,
        destination: line.destination,
        departureAt: departureAt.toISOString(),
        durationMinutes: line.durationMinutes,
        priceTnd: line.fareTnd,
        remainingSeats: undefined,
        lineCode: line.code,
        providerLabel: `${line.operatorName ?? 'Operator'} • ${line.servicePattern ?? `Every ${line.intervalMinutes} min`}`,
        ctaLabel: 'Acheter ticket',
      };
    });

  const rideResults = ridesSnapshot.docs
    .map((doc) => doc.data())
    .filter((ride) => {
      const matchesDeparture =
        normalizedDeparture.length === 0 ||
        String(ride.departureCity).toLowerCase().includes(normalizedDeparture);
      const matchesDestination =
        normalizedDestination.length === 0 ||
        String(ride.destinationCity).toLowerCase().includes(normalizedDestination);
      const matchesDate =
        filters.date.length === 0 || String(ride.departureAt).slice(0, 10) === filters.date.slice(0, 10);

      return ride.status === 'scheduled' && Number(ride.availableSeats) > 0 && matchesDeparture && matchesDestination && matchesDate;
    })
    .map((ride) => ({
      id: `${ride.id}-search`,
      sourceId: ride.id,
      mode: 'louage',
      title: `Louage ${ride.departureCity} -> ${ride.destinationCity}`,
      departure: ride.departureCity,
      destination: ride.destinationCity,
      departureAt: ride.departureAt,
      durationMinutes: Math.max(
        120,
        Math.round(Math.abs(new Date(ride.departureAt).getHours() - 11) * 18 + Number(ride.priceTnd) * 2),
      ),
      priceTnd: ride.priceTnd,
      remainingSeats: ride.availableSeats,
      lineCode: undefined,
      providerLabel: ride.vehicleModel,
      ctaLabel: 'Reserver',
    }));

  const results = [...lineResults, ...rideResults];
  if (filters.sortBy === 'cheapest') {
    return results.sort((left, right) => left.priceTnd - right.priceTnd);
  }

  if (filters.sortBy === 'duration') {
    return results.sort((left, right) => left.durationMinutes - right.durationMinutes);
  }

  return results.sort(
    (left, right) => new Date(left.departureAt).getTime() - new Date(right.departureAt).getTime(),
  );
});
