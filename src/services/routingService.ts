import { Screen, UserRole } from '../types';

interface RouteResolution {
  screen: Screen;
  canonicalHash: string;
  redirectAfterLogin?: Screen;
}

const SCREEN_PATHS: Record<Screen, string> = {
  welcome: '/welcome',
  'not-found': '/not-found',
  explore: '/explore',
  search: '/search',
  'line-details': '/line-details',
  louage: '/louage',
  bus: '/bus',
  metro: '/metro',
  tickets: '/tickets',
  payment: '/payment',
  'driver-dashboard': '/driver-dashboard',
  'driver-verification': '/driver-verification',
  'create-trip': '/create-trip',
  'admin-review': '/admin-review',
};

const PATH_TO_SCREEN = Object.entries(SCREEN_PATHS).reduce<Record<string, Screen>>(
  (accumulator, [screen, path]) => {
    accumulator[path] = screen as Screen;
    return accumulator;
  },
  {},
);

const DEFAULT_SCREEN_BY_ROLE: Record<UserRole, Screen> = {
  passenger: 'explore',
  driver: 'driver-dashboard',
  admin: 'admin-review',
};

const ROLE_RESTRICTED_SCREENS: Partial<Record<Screen, UserRole[]>> = {
  'driver-dashboard': ['driver'],
  'driver-verification': ['driver'],
  'create-trip': ['driver'],
  'admin-review': ['admin'],
};

function getHashUrl(path: string, redirectAfterLogin?: Screen) {
  if (!redirectAfterLogin) {
    return `#${path}`;
  }

  return `#${path}?redirectAfterLogin=${encodeURIComponent(redirectAfterLogin)}`;
}

function parseHash(hash: string) {
  const trimmed = hash.startsWith('#') ? hash.slice(1) : hash;
  const normalized = trimmed.length > 0 ? trimmed : SCREEN_PATHS.welcome;
  const [pathPart, queryPart] = normalized.split('?');
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  const params = new URLSearchParams(queryPart ?? '');
  const redirectAfterLogin = params.get('redirectAfterLogin');

  return {
    path,
    screen: PATH_TO_SCREEN[path] ?? null,
    redirectAfterLogin:
      redirectAfterLogin && redirectAfterLogin in SCREEN_PATHS
        ? (redirectAfterLogin as Screen)
        : undefined,
  };
}

export function getDefaultScreenForRole(role: UserRole | null | undefined) {
  if (!role) {
    return 'welcome' as const;
  }

  return DEFAULT_SCREEN_BY_ROLE[role];
}

export function isScreenAllowed(screen: Screen, role: UserRole | null | undefined) {
  if (screen === 'welcome' || screen === 'not-found') {
    return true;
  }

  if (!role) {
    return false;
  }

  const allowedRoles = ROLE_RESTRICTED_SCREENS[screen];
  if (!allowedRoles) {
    return true;
  }

  return allowedRoles.includes(role);
}

export function getHashForScreen(screen: Screen, options?: { redirectAfterLogin?: Screen }) {
  return getHashUrl(SCREEN_PATHS[screen], options?.redirectAfterLogin);
}

export function resolveHashRoute(hash: string, role: UserRole | null | undefined): RouteResolution {
  const parsed = parseHash(hash);

  if (!parsed.screen) {
    return {
      screen: 'not-found',
      canonicalHash: getHashForScreen('not-found'),
    };
  }

  if (!role) {
    if (parsed.screen === 'welcome') {
      return {
        screen: 'welcome',
        canonicalHash: getHashForScreen('welcome', {
          redirectAfterLogin: parsed.redirectAfterLogin,
        }),
        redirectAfterLogin: parsed.redirectAfterLogin,
      };
    }

    return {
      screen: 'welcome',
      canonicalHash: getHashForScreen('welcome', {
        redirectAfterLogin: parsed.screen,
      }),
      redirectAfterLogin: parsed.screen,
    };
  }

  if (parsed.screen === 'welcome') {
    const nextScreen =
      parsed.redirectAfterLogin && isScreenAllowed(parsed.redirectAfterLogin, role)
        ? parsed.redirectAfterLogin
        : getDefaultScreenForRole(role);

    return {
      screen: nextScreen,
      canonicalHash: getHashForScreen(nextScreen),
    };
  }

  if (!isScreenAllowed(parsed.screen, role)) {
    const fallback = getDefaultScreenForRole(role);
    return {
      screen: fallback,
      canonicalHash: getHashForScreen(fallback),
    };
  }

  return {
    screen: parsed.screen,
    canonicalHash: getHashForScreen(parsed.screen),
  };
}
