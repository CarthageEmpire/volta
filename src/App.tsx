import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { VoltaProvider, useVolta } from './context/VoltaContext';
import { Screen } from './types';
import WelcomeScreen from './screens/WelcomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import SearchScreen from './screens/SearchScreen';
import LineDetailsScreen from './screens/LineDetailsScreen';
import LouageScreen from './screens/LouageScreen';
import BusScreen from './screens/BusScreen';
import MetroScreen from './screens/MetroScreen';
import TicketsScreen from './screens/TicketsScreen';
import DriverDashboard from './screens/DriverDashboard';
import CreateTripScreen from './screens/CreateTripScreen';
import DriverVerificationScreen from './screens/DriverVerificationScreen';
import PaymentScreen from './screens/PaymentScreen';
import AdminReviewScreen from './screens/AdminReviewScreen';
import NotFoundScreen from './screens/NotFoundScreen';
import { getHashForScreen, resolveHashRoute } from './services/routingService';

function AppShell() {
  const { currentUser } = useVolta();
  const [currentScreen, setCurrentScreen] = useState<Screen>(() =>
    resolveHashRoute(typeof window !== 'undefined' ? window.location.hash : '', null).screen,
  );

  useEffect(() => {
    const syncRoute = () => {
      const resolved = resolveHashRoute(window.location.hash, currentUser?.role);
      setCurrentScreen(resolved.screen);

      if (window.location.hash !== resolved.canonicalHash) {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}${resolved.canonicalHash}`,
        );
      }
    };

    syncRoute();
    window.addEventListener('hashchange', syncRoute);

    return () => {
      window.removeEventListener('hashchange', syncRoute);
    };
  }, [currentUser?.role]);

  const navigate = (screen: Screen) => {
    const nextHash = getHashForScreen(screen);
    if (window.location.hash === nextHash) {
      setCurrentScreen(screen);
    } else {
      window.location.hash = nextHash;
    }
    window.scrollTo(0, 0);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen navigate={navigate} />;
      case 'not-found':
        return <NotFoundScreen navigate={navigate} />;
      case 'explore':
        return <ExploreScreen navigate={navigate} />;
      case 'search':
        return <SearchScreen navigate={navigate} />;
      case 'line-details':
        return <LineDetailsScreen navigate={navigate} />;
      case 'louage':
        return <LouageScreen navigate={navigate} />;
      case 'bus':
        return <BusScreen navigate={navigate} />;
      case 'metro':
        return <MetroScreen navigate={navigate} />;
      case 'tickets':
        return <TicketsScreen navigate={navigate} />;
      case 'payment':
        return <PaymentScreen navigate={navigate} />;
      case 'driver-dashboard':
        return <DriverDashboard navigate={navigate} />;
      case 'driver-verification':
        return <DriverVerificationScreen navigate={navigate} />;
      case 'create-trip':
        return <CreateTripScreen navigate={navigate} />;
      case 'admin-review':
        return <AdminReviewScreen navigate={navigate} />;
      default:
        return <ExploreScreen navigate={navigate} />;
    }
  };

  const showNav = currentScreen !== 'welcome' && Boolean(currentUser);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {showNav && (
        <nav className="fixed bottom-0 left-0 z-50 w-full px-3 pb-4 pt-2 sm:px-4 sm:pb-6 sm:pt-3">
          <div className="mx-auto flex max-w-3xl items-center justify-around rounded-[1.75rem] bg-[rgba(230,232,234,0.92)] px-2 py-2 shadow-[0_-10px_40px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:rounded-[2rem] sm:px-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  currentUser?.role === 'driver'
                    ? 'driver-dashboard'
                    : currentUser?.role === 'admin'
                      ? 'admin-review'
                      : 'explore',
                )
              }
              className={`flex min-w-0 flex-1 flex-col items-center rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] sm:min-w-[72px] sm:flex-none sm:px-4 sm:text-[11px] sm:tracking-[0.18em] ${
                ['explore', 'driver-dashboard', 'admin-review'].includes(currentScreen)
                  ? 'bg-white text-slate-900'
                  : 'text-slate-500'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {currentUser?.role === 'admin' ? 'admin_panel_settings' : 'home'}
              </span>
              Accueil
            </button>

            {currentUser?.role !== 'admin' && (
              <button
                type="button"
                onClick={() => navigate('search')}
                className={`flex min-w-0 flex-1 flex-col items-center rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] sm:min-w-[72px] sm:flex-none sm:px-4 sm:text-[11px] sm:tracking-[0.18em] ${
                  currentScreen === 'search' ? 'bg-white text-slate-900' : 'text-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">search</span>
                Recherche
              </button>
            )}

            {currentUser?.role !== 'admin' && (
              <button
                type="button"
                onClick={() => navigate('tickets')}
                className={`flex min-w-0 flex-1 flex-col items-center rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] sm:min-w-[72px] sm:flex-none sm:px-4 sm:text-[11px] sm:tracking-[0.18em] ${
                  currentScreen === 'tickets' ? 'bg-white text-slate-900' : 'text-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">confirmation_number</span>
                Tickets
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                navigate(
                  currentUser?.role === 'driver'
                    ? 'driver-dashboard'
                    : currentUser?.role === 'admin'
                      ? 'admin-review'
                      : 'louage',
                )
              }
              className={`flex min-w-0 flex-1 flex-col items-center rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] sm:min-w-[72px] sm:flex-none sm:px-4 sm:text-[11px] sm:tracking-[0.18em] ${
                ['louage', 'bus', 'metro', 'line-details', 'driver-dashboard', 'driver-verification', 'create-trip', 'admin-review'].includes(
                  currentScreen,
                )
                  ? 'bg-white text-slate-900'
                  : 'text-slate-500'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {currentUser?.role === 'driver'
                  ? 'directions_car'
                  : currentUser?.role === 'admin'
                    ? 'fact_check'
                    : 'commute'}
              </span>
              {currentUser?.role === 'driver'
                ? 'Driver'
                : currentUser?.role === 'admin'
                  ? 'Review'
                  : 'Modes'}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <VoltaProvider>
      <AppShell />
    </VoltaProvider>
  );
}
