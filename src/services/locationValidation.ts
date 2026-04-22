export function validateLocationPair(
  departure: string,
  destination: string,
  noun: 'ville' | 'station' | 'lieu',
) {
  if (!departure || !destination) {
    const article = noun === 'ville' ? 'une' : 'une';
    return `Veuillez sélectionner ${article} ${noun} de départ et ${article} ${noun} de destination.`;
  }

  if (departure === destination) {
    return 'Le départ et la destination doivent être différents.';
  }

  return '';
}
