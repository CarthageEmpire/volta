import { Screen } from '../types';
import TopAppBar from '../components/TopAppBar';
import { BOOKINGS } from '../constants';

interface DriverDashboardProps {
  navigate: (screen: Screen) => void;
}

export default function DriverDashboard({ navigate }: DriverDashboardProps) {
  return (
    <div className="bg-background text-on-surface font-body min-h-screen pb-32">
      <TopAppBar title="Volta" onBack={() => navigate('explore')} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <header className="mb-12">
          <span className="font-label text-[11px] uppercase tracking-widest text-primary font-bold mb-2 block">Driver Control Center</span>
          <h2 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-tight">
            Your rhythm,<br/><span className="text-primary">mastered.</span>
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <section className="md:col-span-8 bg-surface-container-lowest rounded-2xl p-8 shadow-[0_8px_24px_rgba(25,28,30,0.04)] flex flex-col justify-between min-h-[320px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="font-headline text-xl font-bold">Income Summary</h3>
                  <p className="text-on-surface-variant text-sm">Earnings for October 2023</p>
                </div>
                <span className="material-symbols-outlined text-primary bg-primary-fixed p-3 rounded-2xl">account_balance_wallet</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-extrabold tracking-tighter">$2,840.50</span>
                <span className="text-secondary font-bold flex items-center text-sm">
                  <span className="material-symbols-outlined text-sm">trending_up</span> +12%
                </span>
              </div>
            </div>
            <div className="relative z-10 flex gap-4 mt-auto">
              <div className="flex-1 bg-surface-container-low p-4 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Weekly Average</p>
                <p className="font-headline font-bold text-lg">$710.12</p>
              </div>
              <div className="flex-1 bg-surface-container-low p-4 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Active Hours</p>
                <p className="font-headline font-bold text-lg">34h 12m</p>
              </div>
            </div>
          </section>

          <section 
            onClick={() => navigate('create-trip')}
            className="md:col-span-4 bg-primary-container rounded-2xl p-8 flex flex-col justify-center items-center text-center group cursor-pointer active:scale-95 transition-all"
          >
            <div className="bg-on-primary/10 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-on-primary-container text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
            </div>
            <h3 className="font-headline text-2xl font-black text-on-primary-container mb-2 tracking-tight">Create New Ad</h3>
            <p className="text-on-primary-container/80 text-sm px-4">Post a new route and start earning from empty seats.</p>
            <button className="mt-8 bg-secondary-fixed text-on-secondary-fixed px-8 py-3 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all">Launch Route</button>
          </section>

          <section className="md:col-span-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-2xl font-bold">Active Ads</h3>
              <button className="text-primary font-bold text-sm hover:underline">View All</button>
            </div>
            
            <div className="bg-surface-container-lowest p-6 rounded-2xl flex items-center gap-6 group hover:bg-white transition-colors shadow-sm">
              <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-on-secondary-container text-3xl">directions_car</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-lg leading-tight">Downtown → Airport Express</h4>
                  <span className="bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">Live</span>
                </div>
                <p className="text-on-surface-variant text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span> Daily, 08:00 AM
                </p>
              </div>
              <div className="text-right">
                <p className="font-headline font-extrabold text-lg">$25</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold">per seat</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl flex items-center gap-6 group hover:bg-white transition-colors shadow-sm">
              <div className="w-16 h-16 bg-surface-container-high rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-outline text-3xl">map</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-lg leading-tight">Suburban Commute A</h4>
                  <span className="bg-surface-variant text-on-surface-variant text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">Paused</span>
                </div>
                <p className="text-on-surface-variant text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span> Weekdays, 05:00 PM
                </p>
              </div>
              <div className="text-right">
                <p className="font-headline font-extrabold text-lg">$18</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold">per seat</p>
              </div>
            </div>
          </section>

          <section className="md:col-span-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-2xl font-bold">Upcoming Bookings</h3>
              <div className="flex gap-2">
                <span className="bg-secondary-fixed text-on-secondary-fixed font-bold text-xs px-3 py-1 rounded-full">3 Today</span>
              </div>
            </div>
            <div className="bg-surface-container-high/50 rounded-3xl p-2 space-y-2">
              {BOOKINGS.map((booking) => (
                <div key={booking.id} className={`bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between ${booking.status === 'pending' ? 'opacity-75' : ''}`}>
                  <div className="flex items-center gap-4">
                    {booking.passengerAvatar ? (
                      <img alt="Passenger" className="w-12 h-12 rounded-full object-cover" src={booking.passengerAvatar} referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-on-surface-variant">
                        {booking.passengerName.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{booking.passengerName}</p>
                      <p className="text-xs text-on-surface-variant">Seat {booking.seat} • {booking.trip}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${booking.status === 'confirmed' ? 'text-primary' : 'text-on-surface-variant'}`}>{booking.time}</p>
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant">{booking.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <button className="fixed bottom-24 right-6 bg-primary-container text-on-primary p-4 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all md:bottom-12 md:right-12">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
      </button>
    </div>
  );
}
