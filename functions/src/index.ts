import { setGlobalOptions } from 'firebase-functions/v2';
import { bootstrapUserProfile, ensureUserProfile, updateUserLocale } from './handlers/auth.js';
import {
  cancelDriverRide,
  cancelPassengerBooking,
  confirmPayment,
  confirmRideCompletion,
  createCheckoutIntent,
  markRideAwaitingConfirmation,
  reportNoShow,
} from './handlers/bookings.js';
import { createRide, toggleDriverLiveSharing } from './handlers/rides.js';
import { searchTransport } from './handlers/search.js';
import { reviewDriverVerification, submitDriverVerification } from './handlers/verification.js';

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
});

export {
  bootstrapUserProfile,
  ensureUserProfile,
  updateUserLocale,
  submitDriverVerification,
  reviewDriverVerification,
  createRide,
  toggleDriverLiveSharing,
  createCheckoutIntent,
  confirmPayment,
  cancelPassengerBooking,
  cancelDriverRide,
  markRideAwaitingConfirmation,
  confirmRideCompletion,
  reportNoShow,
  searchTransport,
};
