# Volta

Volta is a Firebase-backed Tunisia transit app with passenger, driver, and admin flows for:
- metro and bus lines
- louage ride publishing and booking
- driver verification with document uploads
- QR tickets
- payment, refund, payout, and no-show state transitions

## Stack

- Vite + React + TypeScript
- Firebase Authentication
- Cloud Firestore
- Cloud Functions for Firebase
- Firebase Storage
- Firestore and Storage Security Rules
- Firebase Emulator Suite

## What Was Added

- Firebase client setup in the frontend
- Firestore-backed `VoltaContext`
- Cloud Functions for auth/profile bootstrap, verification, rides, checkout, payment, cancellation, completion, no-show, and search
- Firestore rules and Storage rules
- Emulator configuration and seed workflow
- Demo project config via `.firebaserc`

## Key Files

- [src/context/VoltaContext.tsx](/c:/Users/Gigabite/Downloads/volta/src/context/VoltaContext.tsx)
- [src/services/firebaseApp.ts](/c:/Users/Gigabite/Downloads/volta/src/services/firebaseApp.ts)
- [src/services/firebaseVoltaService.ts](/c:/Users/Gigabite/Downloads/volta/src/services/firebaseVoltaService.ts)
- [functions/src/index.ts](/c:/Users/Gigabite/Downloads/volta/functions/src/index.ts)
- [firestore.rules](/c:/Users/Gigabite/Downloads/volta/firestore.rules)
- [storage.rules](/c:/Users/Gigabite/Downloads/volta/storage.rules)
- [functions/scripts/seed.ts](/c:/Users/Gigabite/Downloads/volta/functions/scripts/seed.ts)

## Local Setup

1. Install root dependencies:
   `npm install`
2. Install functions dependencies:
   `cd functions && npm install`
3. Copy `.env.example` to `.env.local` if you want explicit frontend env values.
4. Seed the emulator data:
   `npm run firebase:seed`
5. Start Firebase emulators:
   `npm run firebase:emulators`
6. In another terminal, start the frontend:
   `npm run dev`
7. For Android emulator builds, set `VITE_FIREBASE_EMULATOR_HOST=10.0.2.2` in `.env.local` before `npm run android:run`.
   If you test on a physical phone, use your computer's LAN IP instead.

The repo defaults to the demo Firebase project id `demo-volta-local`, so emulator work does not need a real Firebase project.

## Demo Accounts

- Passenger: `imen@volta.tn` / `volta123`
- Driver: `hamed@volta.tn` / `volta123`
- Admin: `admin@volta.tn` / `admin123`

## Firebase Data Model

- `/users/{userId}`
- `/verificationRequests/{requestId}`
- `/lines/{lineId}`
- `/liveVehicles/{vehicleId}`
- `/rides/{rideId}`
- `/bookings/{bookingId}`
- `/tickets/{ticketId}`
- `/payments/{paymentId}`
- `/favorites/{favoriteId}`
- `/nearbyTransport/{itemId}`

Transit lines store embedded stops to keep line reads simple for the current app.

## Cloud Functions

Callable functions implemented:

- `bootstrapUserProfile`
- `updateUserLocale`
- `submitDriverVerification`
- `reviewDriverVerification`
- `createRide`
- `toggleDriverLiveSharing`
- `createCheckoutIntent`
- `confirmPayment`
- `cancelPassengerBooking`
- `cancelDriverRide`
- `markRideAwaitingConfirmation`
- `confirmRideCompletion`
- `reportNoShow`
- `searchTransport`

Payment providers are intentionally stubbed behind a backend service layer. The current callable flow records paid/refunded states cleanly, but real gateway SDK/webhook integration is still a follow-up.

## Security Model

- users can read their own profile
- admins can read all users and verification requests
- users can read only their own tickets, favorites, and passenger-side payments
- drivers can read their own driver-side bookings and payouts
- all sensitive writes are done through Cloud Functions
- verification files are owner-write and admin/owner-read in Storage

## Notes

- `SearchScreen` still renders from the synced Firestore-backed app state for a fast in-app experience, while a backend `searchTransport` callable is also available.
- `resetDemo` in the welcome screen clears local session/UI state; the canonical demo data reset is `npm run firebase:seed`.
- Firebase CLI may still print a harmless unauthenticated warning when running emulators locally.
- Firebase tools also warns that Java 21 will soon be preferred. The emulator suite still ran successfully during verification on Java 17, but upgrading to Java 21 is recommended.
