import { LouageRide, SearchMatchType, TransportLine, TransportMode } from '../types';
import {
  buildSuggestionExplanation,
  buildSuggestionMatchType,
  createEmptyLocationMatch,
  type LocationMatchScore,
  scoreLocationMatch,
  scoreTextSearch,
} from './locationSuggestions';
import { normalizeText } from './normalizeText';

interface RoutePoint {
  index: number;
  name: string;
}

interface IndexedLocationMatch {
  index: number;
  match: LocationMatchScore;
}

interface OrderedSelection {
  departure: IndexedLocationMatch;
  destination: IndexedLocationMatch;
}

export interface RankedLineSearchResult {
  line: TransportLine;
  matchType: SearchMatchType;
  matchExplanation: string;
  relevanceScore: number;
}

export interface RankedRideSearchResult {
  ride: LouageRide;
  matchType: SearchMatchType;
  matchExplanation: string;
  relevanceScore: number;
}

function buildRoutePoints(line: TransportLine) {
  const values = [line.origin, ...line.stops.map((stop) => stop.name), line.destination];
  const routePoints: RoutePoint[] = [];
  let previousNormalized = '';

  for (const value of values) {
    const normalized = normalizeText(value).replace(/[^a-z0-9]+/g, ' ').trim();
    if (!normalized || normalized === previousNormalized) {
      continue;
    }

    routePoints.push({
      index: routePoints.length,
      name: value,
    });
    previousNormalized = normalized;
  }

  return routePoints;
}

function getBestIndexedMatches(query: string, routePoints: RoutePoint[]) {
  return routePoints
    .map((point) => ({
      index: point.index,
      match: scoreLocationMatch(query, [point.name]),
    }))
    .filter((candidate) => candidate.match.score > 0)
    .sort((left, right) => {
      if (right.match.score !== left.match.score) {
        return right.match.score - left.match.score;
      }

      if (left.match.isDirect !== right.match.isDirect) {
        return Number(right.match.isDirect) - Number(left.match.isDirect);
      }

      return left.index - right.index;
    });
}

function getBestOrderedSelection(
  routePoints: RoutePoint[],
  departure: string,
  destination: string,
) {
  const departureMatches = getBestIndexedMatches(departure, routePoints);
  const destinationMatches = getBestIndexedMatches(destination, routePoints);
  let bestSelection: OrderedSelection | null = null;

  for (const departureMatch of departureMatches) {
    for (const destinationMatch of destinationMatches) {
      if (destinationMatch.index <= departureMatch.index) {
        continue;
      }

      const candidate: OrderedSelection = {
        departure: departureMatch,
        destination: destinationMatch,
      };

      if (!bestSelection) {
        bestSelection = candidate;
        continue;
      }

      const candidateScore = candidate.departure.match.score + candidate.destination.match.score;
      const currentScore = bestSelection.departure.match.score + bestSelection.destination.match.score;
      if (candidateScore !== currentScore) {
        if (candidateScore > currentScore) {
          bestSelection = candidate;
        }
        continue;
      }

      const candidateSpan = candidate.destination.index - candidate.departure.index;
      const currentSpan = bestSelection.destination.index - bestSelection.departure.index;
      if (candidateSpan < currentSpan) {
        bestSelection = candidate;
      }
    }
  }

  return bestSelection;
}

function buildLineResultFromSelection(
  line: TransportLine,
  selection: OrderedSelection,
  queryScore: number,
  mode: Extract<TransportMode, 'bus' | 'metro'>,
) {
  const matchType = buildSuggestionMatchType(selection.departure.match, selection.destination.match);
  const span = selection.destination.index - selection.departure.index;

  return {
    line,
    matchType,
    matchExplanation: buildSuggestionExplanation(
      matchType,
      selection.departure.match,
      selection.destination.match,
      `Meilleure ligne ${mode} disponible`,
    ),
    relevanceScore:
      selection.departure.match.score +
      selection.destination.match.score +
      queryScore +
      (matchType === 'direct'
        ? 140
        : matchType === 'network_suggestion'
          ? 88
          : 64) -
      span * 6,
  } satisfies RankedLineSearchResult;
}

function buildLineResultFromPartialFilters(
  line: TransportLine,
  routePoints: RoutePoint[],
  filters: { departure: string; destination: string; query: string },
  mode: Extract<TransportMode, 'bus' | 'metro'>,
) {
  const departureMatch =
    filters.departure.trim().length > 0
      ? getBestIndexedMatches(filters.departure, routePoints)[0]?.match ?? createEmptyLocationMatch()
      : createEmptyLocationMatch();
  const destinationMatch =
    filters.destination.trim().length > 0
      ? getBestIndexedMatches(filters.destination, routePoints)[0]?.match ?? createEmptyLocationMatch()
      : createEmptyLocationMatch();
  const queryScore = scoreTextSearch(filters.query, [
    line.code,
    line.name,
    line.routeLabel,
    line.origin,
    line.destination,
    ...line.stops.map((stop) => stop.name),
    line.servicePattern ?? '',
  ]);

  if (departureMatch.score === 0 && destinationMatch.score === 0 && queryScore === 0) {
    return null;
  }

  const matchType = buildSuggestionMatchType(departureMatch, destinationMatch);
  const matchExplanation =
    queryScore > 0 && departureMatch.score === 0 && destinationMatch.score === 0
      ? `Ligne ${mode} pertinente pour la recherche "${filters.query.trim()}".`
      : buildSuggestionExplanation(
          matchType,
          departureMatch,
          destinationMatch,
          `Meilleure ligne ${mode} disponible`,
        );

  return {
    line,
    matchType,
    matchExplanation,
    relevanceScore:
      departureMatch.score +
      destinationMatch.score +
      queryScore +
      (matchType === 'direct'
        ? 120
        : matchType === 'network_suggestion'
          ? 84
          : 60),
  } satisfies RankedLineSearchResult;
}

export function rankTransitSectionLines(
  lines: TransportLine[],
  filters: { departure: string; destination: string; query: string },
  mode: Extract<TransportMode, 'bus' | 'metro'>,
) {
  const hasDeparture = filters.departure.trim().length > 0;
  const hasDestination = filters.destination.trim().length > 0;
  const hasQuery = filters.query.trim().length > 0;
  const hasActiveFilters = hasDeparture || hasDestination || hasQuery;

  const matched = lines
    .map((line) => {
      const routePoints = buildRoutePoints(line);
      const queryScore = scoreTextSearch(filters.query, [
        line.code,
        line.name,
        line.routeLabel,
        line.origin,
        line.destination,
        ...line.stops.map((stop) => stop.name),
        line.servicePattern ?? '',
      ]);

      if (hasDeparture && hasDestination) {
        const selection = getBestOrderedSelection(routePoints, filters.departure, filters.destination);
        if (!selection) {
          return null;
        }

        return buildLineResultFromSelection(line, selection, queryScore, mode);
      }

      return buildLineResultFromPartialFilters(line, routePoints, filters, mode);
    })
    .filter((result): result is RankedLineSearchResult => result !== null);

  if (matched.length > 0) {
    return matched.sort((left, right) => {
      if (right.relevanceScore !== left.relevanceScore) {
        return right.relevanceScore - left.relevanceScore;
      }

      if (left.line.intervalMinutes !== right.line.intervalMinutes) {
        return left.line.intervalMinutes - right.line.intervalMinutes;
      }

      if (left.line.fareTnd !== right.line.fareTnd) {
        return left.line.fareTnd - right.line.fareTnd;
      }

      return left.line.code.localeCompare(right.line.code, 'fr', { sensitivity: 'base' });
    });
  }

  return [...lines]
    .sort((left, right) => {
      if (left.intervalMinutes !== right.intervalMinutes) {
        return left.intervalMinutes - right.intervalMinutes;
      }

      if (left.fareTnd !== right.fareTnd) {
        return left.fareTnd - right.fareTnd;
      }

      return left.code.localeCompare(right.code, 'fr', { sensitivity: 'base' });
    })
    .slice(0, 12)
    .map((line) => ({
      line,
      matchType: 'network_suggestion' as const,
      matchExplanation: hasActiveFilters
        ? `Aucune ligne ${mode} proche exacte. Voici les services les plus utiles du reseau actif.`
        : `Lignes ${mode} actives du moment.`,
      relevanceScore: 1,
    }));
}

function scoreRideDatePreference(departureAt: string, requestedDate: string) {
  if (!requestedDate) {
    return 18;
  }

  const rideDate = departureAt.slice(0, 10);
  if (rideDate === requestedDate) {
    return 42;
  }

  if (rideDate > requestedDate) {
    return 22;
  }

  return 4;
}

export function rankLouageSectionRides(
  rides: LouageRide[],
  filters: { departure: string; destination: string; date: string },
) {
  const availableRides = rides.filter((ride) => ride.status === 'scheduled' && ride.availableSeats > 0);
  const hasLocationFilters =
    filters.departure.trim().length > 0 || filters.destination.trim().length > 0;

  const matched = availableRides
    .map((ride) => {
      const departureMatch =
        filters.departure.trim().length > 0
          ? scoreLocationMatch(filters.departure, [ride.departureCity])
          : createEmptyLocationMatch();
      const destinationMatch =
        filters.destination.trim().length > 0
          ? scoreLocationMatch(filters.destination, [ride.destinationCity])
          : createEmptyLocationMatch();

      if (hasLocationFilters && departureMatch.score === 0 && destinationMatch.score === 0) {
        return null;
      }

      const matchType = buildSuggestionMatchType(departureMatch, destinationMatch);
      return {
        ride,
        matchType,
        matchExplanation: hasLocationFilters
          ? buildSuggestionExplanation(
              matchType,
              departureMatch,
              destinationMatch,
              'Meilleur louage disponible',
            )
          : 'Prochain louage disponible autour de la date souhaitee.',
        relevanceScore:
          departureMatch.score +
          destinationMatch.score +
          scoreRideDatePreference(ride.departureAt, filters.date) +
          (matchType === 'direct'
            ? 128
            : matchType === 'network_suggestion'
              ? 92
              : 60),
      } satisfies RankedRideSearchResult;
    })
    .filter((result): result is RankedRideSearchResult => result !== null);

  if (matched.length > 0) {
    return matched.sort((left, right) => {
      if (right.relevanceScore !== left.relevanceScore) {
        return right.relevanceScore - left.relevanceScore;
      }

      const departureDelta =
        new Date(left.ride.departureAt).getTime() - new Date(right.ride.departureAt).getTime();
      if (departureDelta !== 0) {
        return departureDelta;
      }

      return left.ride.priceTnd - right.ride.priceTnd;
    });
  }

  return [...availableRides]
    .sort(
      (left, right) => new Date(left.departureAt).getTime() - new Date(right.departureAt).getTime(),
    )
    .slice(0, 12)
    .map((ride) => ({
      ride,
      matchType: 'network_suggestion' as const,
      matchExplanation: hasLocationFilters
        ? 'Aucun louage proche exact. Voici les prochaines annonces disponibles.'
        : 'Annonces louage actives du moment.',
      relevanceScore: 1,
    }));
}
