import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { adminDb } from '../lib/firebase.js';
import { chargePayment } from '../services/payments.js';
import {
  bookingActionSchema,
  checkoutIntentSchema,
  confirmPaymentSchema,
  rideActionSchema,
} from '../schemas.js';
import { createId, nowIso, requireRole } from '../lib/helpers.js';

function assertDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpsError('invalid-argument', 'Invalid ISO date.');
  }
  return parsed;
}

export const createCheckoutIntent = onCall(async (request) => {
  const actor = requireRole(request, ['passenger', 'driver', 'admin']);
  const input = checkoutIntentSchema.parse(request.data);

  if (input.kind === 'line_ticket') {
    if (!input.lineId) {
      throw new HttpsError('invalid-argument', 'lineId is required for line ticket checkout.');
    }

    const lineSnapshot = await adminDb.collection('lines').doc(input.lineId).get();
    const line = lineSnapshot.data();
    if (!line) {
      throw new HttpsError('not-found', 'Transit line not found.');
    }

    const departure = new Date();
    departure.setMinutes(departure.getMinutes() + 5);

    return {
      kind: 'line_ticket',
      title: `${line.name} ${line.code}`,
      description: `${line.origin} vers ${line.destination}`,
      amountTnd: line.fareTnd,
      mode: line.mode,
      passengerUserId: actor.uid,
      lineId: input.lineId,
      origin: line.origin,
      destination: line.destination,
      departureAt: departure.toISOString(),
    };
  }

  if (!input.rideId) {
    throw new HttpsError('invalid-argument', 'rideId is required for louage checkout.');
  }

  const rideSnapshot = await adminDb.collection('rides').doc(input.rideId).get();
  const ride = rideSnapshot.data();
  if (!ride || ride.status !== 'scheduled' || ride.availableSeats < 1) {
    throw new HttpsError('failed-precondition', 'This ride is no longer available.');
  }

  return {
    kind: 'louage_booking',
    title: `Louage ${ride.departureCity} -> ${ride.destinationCity}`,
    description: `${ride.vehicleModel} - ${ride.plateNumber}`,
    amountTnd: ride.priceTnd,
    mode: 'louage',
    passengerUserId: actor.uid,
    rideId: input.rideId,
    seats: 1,
    origin: ride.departureCity,
    destination: ride.destinationCity,
    departureAt: ride.departureAt,
  };
});

export const confirmPayment = onCall(async (request) => {
  const actor = requireRole(request, ['passenger', 'driver', 'admin']);
  const input = confirmPaymentSchema.parse(request.data);

  if (input.checkout.passengerUserId !== actor.uid) {
    throw new HttpsError('permission-denied', 'Checkout belongs to another user.');
  }

  const paymentCharge = await chargePayment({
    provider: input.provider,
    amountTnd: input.checkout.amountTnd,
    title: input.checkout.title,
  });
  const isPaid = paymentCharge.status === 'paid';

  if (paymentCharge.status === 'failed') {
    throw new HttpsError('failed-precondition', 'Payment could not be confirmed.');
  }

  const bookingId = createId('booking');
  const paymentId = createId('pay');
  const ticketId = createId('ticket');
  const createdAt = nowIso();

  if (input.checkout.kind === 'louage_booking') {
    if (!input.checkout.rideId) {
      throw new HttpsError('invalid-argument', 'rideId is required for a louage booking.');
    }

    await adminDb.runTransaction(async (transaction) => {
      const rideRef = adminDb.collection('rides').doc(input.checkout.rideId!);
      const rideSnapshot = await transaction.get(rideRef);
      const ride = rideSnapshot.data();

      if (!ride || ride.status !== 'scheduled') {
        throw new HttpsError('failed-precondition', 'Ride is no longer available.');
      }

      const seatsRequested = input.checkout.seats ?? 1;
      if (ride.availableSeats < seatsRequested) {
        throw new HttpsError('failed-precondition', 'Not enough seats remain on this ride.');
      }

      const booking = {
        id: bookingId,
        type: 'louage',
        mode: 'louage',
        passengerUserId: actor.uid,
        driverUserId: ride.driverUserId,
        lineId: '',
        rideId: ride.id,
        createdAt,
        departureAt: ride.departureAt,
        origin: ride.departureCity,
        destination: ride.destinationCity,
        seatsBooked: seatsRequested,
        amountTnd: ride.priceTnd,
        status: isPaid ? 'confirmed' : 'pending_payment',
        paymentId,
        ticketId: isPaid ? ticketId : '',
        payoutStatus: isPaid ? 'held' : 'n/a',
        refundStatus: 'none',
        penaltyPercent: 0,
        note: isPaid
          ? 'Paiement confirme et reservation active.'
          : 'Paiement en attente de confirmation fournisseur.',
      };

      const payment = {
        id: paymentId,
        userId: actor.uid,
        driverUserId: ride.driverUserId,
        bookingId,
        provider: paymentCharge.provider,
        amountTnd: ride.priceTnd,
        createdAt,
        status: paymentCharge.status,
        payoutStatus: isPaid ? 'held' : 'n/a',
        summary: paymentCharge.summary,
        providerReference: paymentCharge.providerReference,
        processor: paymentCharge.processor,
      };

      transaction.set(adminDb.collection('bookings').doc(bookingId), booking);
      transaction.set(adminDb.collection('payments').doc(paymentId), payment);

      if (isPaid) {
        const validUntil = new Date(assertDate(ride.departureAt).getTime() + 6 * 60 * 60 * 1000)
          .toISOString();
        const ticket = {
          id: ticketId,
          userId: actor.uid,
          bookingId,
          mode: 'louage',
          title: `Louage ${ride.departureCity} -> ${ride.destinationCity}`,
          validFrom: createdAt,
          validUntil,
          priceTnd: ride.priceTnd,
          zones: 'Interurbain',
          qrPayload: JSON.stringify({
            ticketId,
            bookingId,
            validUntil,
            origin: ride.departureCity,
            destination: ride.destinationCity,
            mode: 'louage',
          }),
          status: 'active',
        };
        transaction.set(adminDb.collection('tickets').doc(ticketId), ticket);
      }

      transaction.update(rideRef, {
        availableSeats: ride.availableSeats - seatsRequested,
        updatedAt: createdAt,
      });
    });

    return {
      bookingId,
      ticketId: isPaid ? ticketId : '',
      paymentId,
      paymentStatus: paymentCharge.status,
      message: isPaid
        ? 'Paiement confirme et ticket genere.'
        : 'Paiement en attente de confirmation fournisseur.',
    };
  }

  if (!input.checkout.lineId) {
    throw new HttpsError('invalid-argument', 'lineId is required for a line ticket checkout.');
  }

  const lineSnapshot = await adminDb.collection('lines').doc(input.checkout.lineId).get();
  const line = lineSnapshot.data();
  if (!line) {
    throw new HttpsError('not-found', 'Transit line not found.');
  }

  const validUntil = new Date(Date.now() + 90 * 60 * 1000).toISOString();
  await adminDb.collection('bookings').doc(bookingId).set({
    id: bookingId,
    type: 'line_ticket',
    mode: line.mode,
    passengerUserId: actor.uid,
    driverUserId: '',
    lineId: line.id,
    rideId: '',
    createdAt,
    departureAt: input.checkout.departureAt,
    origin: line.origin,
    destination: line.destination,
    seatsBooked: 1,
    amountTnd: line.fareTnd,
    status: isPaid ? 'confirmed' : 'pending_payment',
    paymentId,
    ticketId: isPaid ? ticketId : '',
    payoutStatus: 'n/a',
    refundStatus: 'none',
    penaltyPercent: 0,
    note: isPaid
      ? 'Paiement confirme et ticket genere.'
      : 'Paiement en attente de confirmation fournisseur.',
  });

  await adminDb.collection('payments').doc(paymentId).set({
    id: paymentId,
    userId: actor.uid,
    driverUserId: '',
    bookingId,
    provider: paymentCharge.provider,
    amountTnd: line.fareTnd,
    createdAt,
    status: paymentCharge.status,
    payoutStatus: 'n/a',
    summary: paymentCharge.summary,
    providerReference: paymentCharge.providerReference,
    processor: paymentCharge.processor,
  });

  if (isPaid) {
    await adminDb.collection('tickets').doc(ticketId).set({
      id: ticketId,
      userId: actor.uid,
      bookingId,
      mode: line.mode,
      title: `${line.name} ${line.code}`,
      validFrom: createdAt,
      validUntil,
      priceTnd: line.fareTnd,
      zones: `${line.origin} - ${line.destination}`,
      qrPayload: JSON.stringify({
        ticketId,
        bookingId,
        validUntil,
        origin: line.origin,
        destination: line.destination,
        mode: line.mode,
      }),
      status: 'active',
    });
  }

  return {
    bookingId,
    ticketId: isPaid ? ticketId : '',
    paymentId,
    paymentStatus: paymentCharge.status,
    message: isPaid
      ? 'Paiement confirme et ticket genere.'
      : 'Paiement en attente de confirmation fournisseur.',
  };
});

export const cancelPassengerBooking = onCall(async (request) => {
  const actor = requireRole(request, ['passenger', 'driver', 'admin']);
  const input = bookingActionSchema.parse(request.data);

  await adminDb.runTransaction(async (transaction) => {
    const bookingRef = adminDb.collection('bookings').doc(input.bookingId);
    const bookingSnapshot = await transaction.get(bookingRef);
    const booking = bookingSnapshot.data();
    const updatedAt = nowIso();

    if (!booking || booking.type !== 'louage' || booking.passengerUserId !== actor.uid) {
      throw new HttpsError('not-found', 'Louage booking not found.');
    }

    if (!['confirmed', 'awaiting_passenger_confirmation'].includes(String(booking.status))) {
      throw new HttpsError('failed-precondition', 'This booking can no longer be cancelled.');
    }

    const departure = assertDate(String(booking.departureAt));
    const refundable = (departure.getTime() - Date.now()) / (1000 * 60 * 60) >= 2;
    const rideRef = booking.rideId
      ? adminDb.collection('rides').doc(String(booking.rideId))
      : null;
    const rideSnapshot = rideRef ? await transaction.get(rideRef) : null;
    const ride = rideSnapshot?.data() ?? null;

    transaction.update(bookingRef, {
      status: 'cancelled_by_passenger',
      refundStatus: refundable ? 'eligible' : 'non_refundable',
      payoutStatus: refundable ? 'refunded' : booking.payoutStatus,
      note: refundable
        ? 'Cancellation within grace period: refund allowed.'
        : 'Cancellation after grace period: not refundable.',
      updatedAt,
    });

    if (booking.paymentId && refundable) {
      transaction.update(adminDb.collection('payments').doc(String(booking.paymentId)), {
        status: 'refunded',
        payoutStatus: 'refunded',
        updatedAt,
      });
    }

    if (rideRef && ride) {
      transaction.update(rideRef, {
        availableSeats: Number(ride.availableSeats ?? 0) + Number(booking.seatsBooked ?? 1),
        updatedAt,
      });
    }
  });

  return { bookingId: input.bookingId };
});

export const cancelDriverRide = onCall(async (request) => {
  const actor = requireRole(request, ['driver']);
  const input = rideActionSchema.parse(request.data);

  await adminDb.runTransaction(async (transaction) => {
    const rideRef = adminDb.collection('rides').doc(input.rideId);
    const rideSnapshot = await transaction.get(rideRef);
    const ride = rideSnapshot.data();
    const updatedAt = nowIso();

    if (!ride || ride.driverUserId !== actor.uid) {
      throw new HttpsError('not-found', 'Ride not found.');
    }

    if (ride.status !== 'scheduled') {
      throw new HttpsError('failed-precondition', 'This ride can no longer be cancelled.');
    }

    const diffHours = (assertDate(String(ride.departureAt)).getTime() - Date.now()) / (1000 * 60 * 60);
    const penalty = diffHours < 1 ? 10 : 0;
    const driverRef = adminDb.collection('users').doc(actor.uid);
    const driverSnapshot = await transaction.get(driverRef);
    const driver = driverSnapshot.data() ?? {};
    const bookingsQuery = adminDb.collection('bookings').where('rideId', '==', input.rideId);
    const bookingsSnapshot = await transaction.get(bookingsQuery);

    transaction.update(rideRef, {
      status: 'cancelled',
      updatedAt,
    });

    if (penalty > 0) {
      const currentPenaltyCount = Number(driver.penaltyCount ?? 0);
      const currentRating = Number(driver.rating ?? 4.5);
      transaction.set(
        driverRef,
        {
          penaltyCount: currentPenaltyCount + 1,
          rating: Math.max(1, Number((currentRating - 0.1).toFixed(2))),
          updatedAt,
        },
        { merge: true },
      );
    }

    for (const bookingDoc of bookingsSnapshot.docs) {
      const booking = bookingDoc.data();
      if (!['confirmed', 'awaiting_passenger_confirmation'].includes(String(booking.status))) {
        continue;
      }

      transaction.update(bookingDoc.ref, {
        status: 'cancelled_by_driver',
        refundStatus: 'refunded',
        payoutStatus: 'refunded',
        penaltyPercent: penalty,
        note:
          penalty > 0
            ? 'Driver cancelled under one hour before departure: full refund and 10% penalty metadata.'
            : 'Driver cancelled ride: full refund issued.',
        updatedAt,
      });

      if (booking.paymentId) {
        transaction.update(adminDb.collection('payments').doc(String(booking.paymentId)), {
          status: 'refunded',
          payoutStatus: 'refunded',
          updatedAt,
        });
      }
    }
  });

  return { rideId: input.rideId };
});

export const markRideAwaitingConfirmation = onCall(async (request) => {
  const actor = requireRole(request, ['driver']);
  const input = bookingActionSchema.parse(request.data);
  const bookingRef = adminDb.collection('bookings').doc(input.bookingId);
  const bookingSnapshot = await bookingRef.get();
  const booking = bookingSnapshot.data();

  if (!booking || booking.driverUserId !== actor.uid) {
    throw new HttpsError('not-found', 'Booking not found.');
  }

  if (booking.status !== 'confirmed') {
    throw new HttpsError('failed-precondition', 'This booking cannot move to awaiting confirmation.');
  }

  await bookingRef.update({
    status: 'awaiting_passenger_confirmation',
    updatedAt: nowIso(),
  });

  return { bookingId: input.bookingId };
});

export const confirmRideCompletion = onCall(async (request) => {
  const actor = requireRole(request, ['passenger', 'driver', 'admin']);
  const input = bookingActionSchema.parse(request.data);
  const bookingRef = adminDb.collection('bookings').doc(input.bookingId);
  const bookingSnapshot = await bookingRef.get();
  const booking = bookingSnapshot.data();

  if (!booking || booking.passengerUserId !== actor.uid) {
    throw new HttpsError('not-found', 'Booking not found.');
  }

  if (booking.status !== 'awaiting_passenger_confirmation') {
    throw new HttpsError('failed-precondition', 'Passenger confirmation is not expected yet.');
  }

  await bookingRef.update({
    status: 'completed',
    payoutStatus: 'released',
    note: 'Ride confirmed by passenger.',
    updatedAt: nowIso(),
  });

  if (booking.driverUserId) {
    const driverRef = adminDb.collection('users').doc(String(booking.driverUserId));
    const driverSnapshot = await driverRef.get();
    const driver = driverSnapshot.data() ?? {};
    await driverRef.set(
      {
        completedTrips: Number(driver.completedTrips ?? 0) + 1,
        rating: Number((driver.rating ?? 4.5).toFixed(2)),
        updatedAt: nowIso(),
      },
      { merge: true },
    );
  }

  if (booking.paymentId) {
    await adminDb.collection('payments').doc(String(booking.paymentId)).set(
      {
        payoutStatus: 'released',
      },
      { merge: true },
    );
  }

  return { bookingId: input.bookingId };
});

export const reportNoShow = onCall(async (request) => {
  const actor = requireRole(request, ['driver']);
  const input = bookingActionSchema.parse(request.data);
  const bookingRef = adminDb.collection('bookings').doc(input.bookingId);
  const bookingSnapshot = await bookingRef.get();
  const booking = bookingSnapshot.data();

  if (!booking || booking.driverUserId !== actor.uid) {
    throw new HttpsError('not-found', 'Booking not found.');
  }

  if (!['confirmed', 'awaiting_passenger_confirmation'].includes(String(booking.status))) {
    throw new HttpsError('failed-precondition', 'The current status does not allow a no-show report.');
  }

  const liveVehicleSnapshot = await adminDb.collection('liveVehicles').doc(`live-${actor.uid}`).get();
  const liveVehicle = liveVehicleSnapshot.data() ?? {};
  const liveUpdatedAt = liveVehicle.updatedAt ? new Date(String(liveVehicle.updatedAt)) : null;
  const departureAt = assertDate(String(booking.departureAt));
  const liveProofWindowMs = 90 * 60 * 1000;
  const hasFreshShare =
    liveUpdatedAt !== null &&
    Math.abs(liveUpdatedAt.getTime() - departureAt.getTime()) <= liveProofWindowMs;
  const hasCoordinates =
    typeof liveVehicle.latitude === 'number' && typeof liveVehicle.longitude === 'number';
  const liveProof = Boolean(liveVehicle.sharingEnabled) && hasFreshShare && hasCoordinates;

  await bookingRef.update({
    status: 'no_show_reported',
    payoutStatus: liveProof ? 'eligible_with_proof' : booking.payoutStatus,
    note: liveProof
      ? 'Passenger no-show reported with fresh live location proof.'
      : 'Passenger no-show reported without recent location proof.',
    updatedAt: nowIso(),
  });

  if (booking.paymentId && liveProof) {
    await adminDb.collection('payments').doc(String(booking.paymentId)).set(
      {
        payoutStatus: 'eligible_with_proof',
      },
      { merge: true },
    );
  }

  return { bookingId: input.bookingId };
});
