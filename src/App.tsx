import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from './types';
import WelcomeScreen from './screens/WelcomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import LineDetailsScreen from './screens/LineDetailsScreen';
import LouageScreen from './screens/LouageScreen';
import TicketsScreen from './screens/TicketsScreen';
import DriverDashboard from './screens/DriverDashboard';
import CreateTripScreen from './screens/CreateTripScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [userRole, setUserRole] = useState<'passenger' | 'driver'>('passenger');

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onLogin={() => navigate('explore')} onRoleChange={setUserRole} currentRole={userRole} />;
      case 'explore':
        return <ExploreScreen navigate={navigate} />;
      case 'line-details':
        return <LineDetailsScreen navigate={navigate} />;
      case 'louage':
        return <LouageScreen navigate={navigate} />;
      case 'tickets':
        return <TicketsScreen navigate={navigate} />;
      case 'driver-dashboard':
        return <DriverDashboard navigate={navigate} />;
      case 'create-trip':
        return <CreateTripScreen navigate={navigate} />;
      default:
        return <ExploreScreen navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {currentScreen !== 'welcome' && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-3 pb-8 bg-[#e6e8ea]/80 backdrop-blur-2xl rounded-t-[1.5rem] shadow-[0_-8px_24px_rgba(25,28,30,0.06)]">
          <button 
            onClick={() => navigate('explore')}
            className={`flex flex-col items-center justify-center px-5 py-2 transition-all active:scale-90 ${currentScreen === 'explore' ? 'bg-[#83fba5] text-[#191c1e] rounded-full' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentScreen === 'explore' ? "'FILL' 1" : undefined }}>explore</span>
            <span className="font-body font-medium text-[11px] uppercase tracking-wider mt-1">Explore</span>
          </button>
          
          <button 
            onClick={() => navigate('tickets')}
            className={`flex flex-col items-center justify-center px-5 py-2 transition-all active:scale-90 ${currentScreen === 'tickets' ? 'bg-[#83fba5] text-[#191c1e] rounded-full' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentScreen === 'tickets' ? "'FILL' 1" : undefined }}>confirmation_number</span>
            <span className="font-body font-medium text-[11px] uppercase tracking-wider mt-1">Tickets</span>
          </button>

          <button 
            onClick={() => navigate(userRole === 'driver' ? 'driver-dashboard' : 'louage')}
            className={`flex flex-col items-center justify-center px-5 py-2 transition-all active:scale-90 ${['louage', 'driver-dashboard', 'create-trip'].includes(currentScreen) ? 'bg-[#83fba5] text-[#191c1e] rounded-full' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: ['louage', 'driver-dashboard', 'create-trip'].includes(currentScreen) ? "'FILL' 1" : undefined }}>directions_car</span>
            <span className="font-body font-medium text-[11px] uppercase tracking-wider mt-1">Louage</span>
          </button>

          <button 
            onClick={() => navigate('welcome')}
            className="flex flex-col items-center justify-center text-slate-500 px-5 py-2 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="font-body font-medium text-[11px] uppercase tracking-wider mt-1">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
}
