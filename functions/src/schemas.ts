import { z } from 'zod';

const optionalStringSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().optional(),
);

const optionalUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().url().optional(),
);

export const roleSchema = z.enum(['passenger', 'driver', 'admin']);
export const localeSchema = z.enum(['fr-TN', 'ar-TN']);
export const genderSchema = z.enum(['femme', 'homme', 'autre']);
export const documentTypeSchema = z.enum([
  'driving_license',
  'national_id',
  'vehicle_insurance',
  'vehicle_registration',
]);
export const paymentProviderSchema = z.enum([
  'bank_card',
  'konnect',
  'flooss',
  'sps',
  'd17',
]);
export const searchSortSchema = z.enum(['cheapest', 'duration', 'departure']);

export const verificationDocumentSchema = z.object({
  type: documentTypeSchema,
  name: z.string().min(1),
  uploadedAt: z.string().min(1),
  storagePath: optionalStringSchema.refine(
    (value) => value === undefined || value.length > 0,
    'storagePath cannot be empty.',
  ),
  downloadURL: optionalUrlSchema,
});

export const bootstrapProfileSchema = z.object({
  role: z.enum(['passenger', 'driver']),
  email: z.string().email(),
  phone: z.string().optional(),
  fullName: z.string().min(2),
  city: z.string().min(2),
});

export const updateLocaleSchema = z.object({
  locale: localeSchema,
});

export const verificationSubmissionSchema = z.object({
  fullName: z.string().min(2),
  dateOfBirth: z.string().min(1),
  gender: genderSchema,
  cityOfResidence: z.string().min(2),
  phone: z.string().min(8),
  phoneVerified: z.boolean(),
  documents: z.array(verificationDocumentSchema).min(4),
});

export const reviewVerificationSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
});

export const createRideSchema = z.object({
  departureCity: z.string().min(2),
  destinationCity: z.string().min(2),
  departureAt: z.string().min(1),
  availableSeats: z.number().int().min(1).max(8),
  priceTnd: z.number().positive(),
  vehicleModel: z.string().min(2),
  plateNumber: z.string().min(4),
  vehiclePhotoName: optionalStringSchema,
  vehiclePhotoPath: optionalStringSchema,
  vehiclePhotoUrl: optionalUrlSchema,
});

export const toggleLiveSharingSchema = z.object({
  enabled: z.boolean(),
});

export const checkoutIntentSchema = z.object({
  kind: z.enum(['line_ticket', 'louage_booking']),
  lineId: z.string().optional(),
  rideId: z.string().optional(),
});

export const checkoutPayloadSchema = z.object({
  kind: z.enum(['line_ticket', 'louage_booking']),
  title: z.string().min(1),
  description: z.string().min(1),
  amountTnd: z.number().positive(),
  mode: z.enum(['metro', 'bus', 'louage']),
  passengerUserId: z.string().min(1),
  lineId: z.string().optional(),
  rideId: z.string().optional(),
  seats: z.number().int().min(1).optional(),
  origin: z.string().min(1),
  destination: z.string().min(1),
  departureAt: z.string().min(1),
});

export const confirmPaymentSchema = z.object({
  checkout: checkoutPayloadSchema,
  provider: paymentProviderSchema,
});

export const bookingActionSchema = z.object({
  bookingId: z.string().min(1),
});

export const rideActionSchema = z.object({
  rideId: z.string().min(1),
});

export const searchTransportSchema = z.object({
  departure: z.string(),
  destination: z.string(),
  date: z.string(),
  sortBy: searchSortSchema,
});
