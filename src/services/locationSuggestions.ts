import { SearchMatchType } from '../types';
import { normalizeText } from './normalizeText';

export interface LocationMatchScore {
  score: number;
  label: string;
  family?: string;
  isDirect: boolean;
}

type LocationFamilyConfig = {
  label: string;
  broadAliases: string[];
  memberAliases: string[];
};

const LOCATION_FAMILIES: Record<string, LocationFamilyConfig> = {
  tunis: {
    label: 'Grand Tunis',
    broadAliases: ['tunis', 'grand tunis', 'banlieue tunis', 'banlieue nord', 'banlieue sud'],
    memberAliases: [
      'tunis',
      'tunis marine',
      'tunis marine nord',
      'station barcelone',
      'place barcelone',
      'place barcelone nord',
      'place barcelone sud',
      'place de la republique',
      'avenue carthage',
      'bab alioua',
      'bab bhar',
      'bab saadoun',
      'bab laassal',
      'bab el khadhra',
      'bardo',
      'bouchoucha',
      'den den',
      'el mourouj',
      'mourouj',
      'la goulette',
      'port la goulette',
      'le kram',
      'la marsa',
      'rades',
      'khaireddine',
      'khiaireddine',
      'manouba',
      'mannouba',
      'ariana',
      'ben arous',
      'campus universitaire',
      'cite des sciences',
      'cite sportive',
      'mohamed v',
      'independance',
      'khaznadar',
      'yesminet',
      'intilaka',
    ],
  },
  cap_bon: {
    label: 'Cap Bon',
    broadAliases: ['cap bon'],
    memberAliases: ['nabeul', 'hammamet', 'zaghouan'],
  },
  sousse: {
    label: 'Sousse',
    broadAliases: ['sousse'],
    memberAliases: [
      'sousse',
      'bab bhar',
      'msaadin',
      'hay riadh',
      'hay zohour',
      'kalaa seghira',
      'kalaa kebira',
      'jawhara',
      'sahloul',
      'hopital sahloul',
      'bouhsina',
      'hammam sousse',
    ],
  },
  sahel: {
    label: 'Sahel',
    broadAliases: ['sahel'],
    memberAliases: ['sousse', 'monastir', 'mahdia'],
  },
  north_west: {
    label: 'Nord-Ouest',
    broadAliases: ['nord ouest', 'nord-ouest'],
    memberAliases: ['beja', 'jendouba', 'le kef', 'siliana', 'tebourba'],
  },
  centre_west: {
    label: 'Centre-Ouest',
    broadAliases: ['centre ouest', 'centre-ouest'],
    memberAliases: ['kairouan', 'sidi bouzid', 'kasserine'],
  },
  south_east: {
    label: 'Sud-Est',
    broadAliases: ['sud est', 'sud-est'],
    memberAliases: ['gabes', 'medenine', 'zarzis', 'tataouine', 'houmt souk'],
  },
  south_west: {
    label: 'Sud-Ouest',
    broadAliases: ['sud ouest', 'sud-ouest'],
    memberAliases: ['gafsa', 'tozeur', 'kebili'],
  },
  south: {
    label: 'Sud',
    broadAliases: ['sud', 'grand sud'],
    memberAliases: [
      'gabes',
      'medenine',
      'zarzis',
      'tataouine',
      'houmt souk',
      'gafsa',
      'tozeur',
      'kebili',
    ],
  },
};

function normalizeLocation(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, ' ').trim();
}

function compactLocation(value: string) {
  return normalizeLocation(value).replace(/\s+/g, '');
}

function tokenizeLocation(value: string) {
  return normalizeLocation(value)
    .split(' ')
    .filter((token) => token.length > 1);
}

function levenshteinDistance(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  if (!left) {
    return right.length;
  }

  if (!right) {
    return left.length;
  }

  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let col = 0; col < cols; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const substitutionCost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + substitutionCost,
      );
    }
  }

  return matrix[left.length][right.length];
}

function resolveMemberFamilies(value: string) {
  const normalized = normalizeLocation(value);
  const families = new Set<string>();

  if (!normalized) {
    return families;
  }

  for (const [family, config] of Object.entries(LOCATION_FAMILIES)) {
    if (
      [...config.broadAliases, ...config.memberAliases].some(
        (alias) => normalized === alias || normalized.includes(alias) || alias.includes(normalized),
      )
    ) {
      families.add(family);
    }
  }

  return families;
}

function resolveBroadFamilies(value: string) {
  const normalized = normalizeLocation(value);
  const families = new Set<string>();

  if (!normalized) {
    return families;
  }

  for (const [family, config] of Object.entries(LOCATION_FAMILIES)) {
    if (
      config.broadAliases.some(
        (alias) => normalized === alias || normalized.includes(alias) || alias.includes(normalized),
      )
    ) {
      families.add(family);
    }
  }

  return families;
}

function getSharedFamily(left: Set<string>, right: Set<string>) {
  for (const family of left) {
    if (right.has(family)) {
      return family;
    }
  }

  return undefined;
}

function scoreDirectStringMatch(query: string, candidate: string) {
  const normalizedQuery = normalizeLocation(query);
  const normalizedCandidate = normalizeLocation(candidate);
  const compactQuery = compactLocation(query);
  const compactCandidate = compactLocation(candidate);

  if (!normalizedQuery || !normalizedCandidate) {
    return { score: 0, isDirect: false };
  }

  if (normalizedCandidate === normalizedQuery) {
    return { score: 210, isDirect: true };
  }

  if (compactCandidate === compactQuery) {
    return { score: 204, isDirect: true };
  }

  if (
    normalizedCandidate.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedCandidate) ||
    compactCandidate.includes(compactQuery) ||
    compactQuery.includes(compactCandidate)
  ) {
    return { score: 176, isDirect: true };
  }

  const queryTokens = tokenizeLocation(query);
  const candidateTokens = tokenizeLocation(candidate);
  const sharedTokens = queryTokens.filter((token) => candidateTokens.includes(token));

  if (sharedTokens.length > 0) {
    const nearlyCompleteMatch = sharedTokens.length >= Math.max(1, queryTokens.length - 1);
    return {
      score: (nearlyCompleteMatch ? 150 : 122) + sharedTokens.length * 10,
      isDirect: nearlyCompleteMatch,
    };
  }

  if (compactQuery.length >= 4 && compactCandidate.length >= 4) {
    const editDistance = levenshteinDistance(compactQuery, compactCandidate);
    const maxLength = Math.max(compactQuery.length, compactCandidate.length);
    if (editDistance <= 2 && maxLength <= 12) {
      return { score: 136 - editDistance * 8, isDirect: true };
    }
  }

  return { score: 0, isDirect: false };
}

export function createEmptyLocationMatch(): LocationMatchScore {
  return {
    score: 0,
    label: '',
    family: undefined,
    isDirect: false,
  };
}

export function scoreLocationMatch(query: string, candidateValues: string[]) {
  const broadFamilies = resolveBroadFamilies(query);
  let bestMatch = createEmptyLocationMatch();

  for (const candidateValue of candidateValues) {
    const directMatch = scoreDirectStringMatch(query, candidateValue);
    const candidateFamilies = resolveMemberFamilies(candidateValue);
    const sharedFamily = getSharedFamily(broadFamilies, candidateFamilies);
    const familyScore = sharedFamily ? 98 : 0;
    const score = Math.max(directMatch.score, familyScore);

    if (score > bestMatch.score) {
      bestMatch = {
        score,
        label: candidateValue,
        family: sharedFamily,
        isDirect: directMatch.score >= familyScore && directMatch.isDirect,
      };
    }
  }

  return bestMatch;
}

export function scoreTextSearch(query: string, candidateValues: string[]) {
  const broadFamilies = resolveBroadFamilies(query);
  let bestScore = 0;

  for (const candidateValue of candidateValues) {
    const directMatch = scoreDirectStringMatch(query, candidateValue);
    const sharedFamily = getSharedFamily(broadFamilies, resolveMemberFamilies(candidateValue));
    bestScore = Math.max(bestScore, directMatch.score, sharedFamily ? 88 : 0);
  }

  return bestScore;
}

export function buildSuggestionMatchType(
  departureMatch: LocationMatchScore,
  destinationMatch: LocationMatchScore,
): SearchMatchType {
  if (departureMatch.score > 0 && destinationMatch.score > 0) {
    if (departureMatch.isDirect && destinationMatch.isDirect) {
      return 'direct';
    }

    if (!departureMatch.isDirect && destinationMatch.isDirect) {
      return 'departure_area';
    }

    if (departureMatch.isDirect && !destinationMatch.isDirect) {
      return 'destination_area';
    }

    return 'network_suggestion';
  }

  if (departureMatch.score > 0) {
    return 'departure_area';
  }

  if (destinationMatch.score > 0) {
    return 'destination_area';
  }

  return 'network_suggestion';
}

function getFamilyLabel(family?: string, fallback?: string) {
  if (!family) {
    return fallback ?? 'le reseau actif';
  }

  return LOCATION_FAMILIES[family]?.label ?? fallback ?? family;
}

export function buildSuggestionExplanation(
  matchType: SearchMatchType,
  departureMatch: LocationMatchScore,
  destinationMatch: LocationMatchScore,
  fallback = 'Meilleure option backend probable',
) {
  const departureLabel = getFamilyLabel(departureMatch.family, departureMatch.label);
  const destinationLabel = getFamilyLabel(destinationMatch.family, destinationMatch.label);

  switch (matchType) {
    case 'direct':
      return `Trajet direct disponible entre ${departureMatch.label} et ${destinationMatch.label}.`;
    case 'departure_area':
      return `Depart probable detecte autour de ${departureLabel}.`;
    case 'destination_area':
      return `Option utile pour se rapprocher de ${destinationLabel}.`;
    case 'network_suggestion':
    default:
      return `${fallback} entre ${departureLabel} et ${destinationLabel}.`;
  }
}
