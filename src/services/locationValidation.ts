export function validateLocationPair(
  departure: string,
  destination: string,
  noun: 'ville' | 'station' | 'lieu',
) {
  if (!departure || !destination) {
    if (noun === 'station') {
      return 'Select both departure and destination stations.';
    }

    if (noun === 'ville') {
      return 'Select both departure and destination cities.';
    }

    return 'Select both departure and destination locations.';
  }

  if (departure === destination) {
    return 'Departure and destination must be different.';
  }

  return '';
}
