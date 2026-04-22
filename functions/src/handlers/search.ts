import { onCall } from 'firebase-functions/v2/https';
import { adminDb } from '../lib/firebase.js';
import {
  buildTransportSearchResults,
  type SearchLineDoc,
  type SearchRideDoc,
} from '../lib/searchTransport.js';
import { requireRole } from '../lib/helpers.js';
import { searchTransportSchema } from '../schemas.js';

export const searchTransport = onCall(async (request) => {
  requireRole(request, ['passenger', 'driver', 'admin']);
  const filters = searchTransportSchema.parse(request.data);

  const [linesSnapshot, ridesSnapshot] = await Promise.all([
    adminDb.collection('lines').get(),
    adminDb.collection('rides').get(),
  ]);

  const lines = linesSnapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as Omit<SearchLineDoc, 'id'>),
  }));

  const rides = ridesSnapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as Omit<SearchRideDoc, 'id'>),
  }));

  return buildTransportSearchResults({
    lines,
    rides,
    filters,
  });
});
