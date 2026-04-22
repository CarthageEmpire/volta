import { TRANSIT_CITIES, TRANSIT_LINES } from './transitCatalog';

const frenchCollator = new Intl.Collator('fr', { sensitivity: 'base' });

function sortAlphabetically(values: readonly string[]) {
  return [...values].sort((left, right) => frenchCollator.compare(left, right));
}

function uniqueSorted(values: readonly string[]) {
  return sortAlphabetically(Array.from(new Set(values.filter((value) => value.trim().length > 0))));
}

export const TUNISIAN_CITIES = uniqueSorted([
  'Ariana',
  'Beja',
  'Ben Arous',
  'Bizerte',
  'Gabes',
  'Gafsa',
  'Hammamet',
  'Houmt Souk',
  'Jendouba',
  'Kairouan',
  'Kasserine',
  'Kebili',
  'La Manouba',
  'Le Kef',
  'Mahdia',
  'Medenine',
  'Monastir',
  'Nabeul',
  'Sfax',
  'Sidi Bouzid',
  'Siliana',
  'Sousse',
  'Tataouine',
  'Tozeur',
  'Tunis',
  'Zaghouan',
  'Zarzis',
]);

export const REGIONAL_SEARCH_AREAS = uniqueSorted([
  'Grand Tunis',
  'Cap Bon',
  'Sahel',
  'Nord-Ouest',
  'Centre-Ouest',
  'Sud',
  'Sud-Est',
  'Sud-Ouest',
]);

export const BUS_SEARCH_LOCATIONS = uniqueSorted([
  ...TUNISIAN_CITIES,
  ...REGIONAL_SEARCH_AREAS,
  ...TRANSIT_CITIES,
]);

export const LOUAGE_SEARCH_LOCATIONS = uniqueSorted([
  ...TUNISIAN_CITIES,
  ...REGIONAL_SEARCH_AREAS,
]);

export const TUNIS_METRO_STATIONS = uniqueSorted(
  TRANSIT_LINES.filter((line) => line.mode === 'metro').flatMap((line) => [
    line.origin,
    line.destination,
    ...line.stops.map((stop) => stop.name),
  ]),
);

export const SMART_SEARCH_LOCATIONS = uniqueSorted([
  ...BUS_SEARCH_LOCATIONS,
  ...TUNIS_METRO_STATIONS,
]);
