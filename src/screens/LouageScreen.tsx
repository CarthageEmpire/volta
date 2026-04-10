import { Screen } from '../types';
import TopAppBar from '../components/TopAppBar';
import { DRIVERS } from '../constants';

interface LouageScreenProps {
  navigate: (screen: Screen) => void;
}

export default function LouageScreen({ navigate }: LouageScreenProps) {
  return (
    <div className="bg-background text-on-surface font-body min-h-screen pb-32">
      <TopAppBar title="Volta" onBack={() => navigate('explore')} />

      <main className="max-w-5xl mx-auto px-6 pt-8">
        <section className="mb-12">
          <h2 className="font-headline font-extrabold text-5xl md:text-7xl text-on-surface tracking-tighter mb-4">
            The City's <span className="text-primary italic">Pulse.</span>
          </h2>
          <p className="text-on-surface-variant text-lg max-w-xl mb-8">
            Seamless louage connections across the urban sanctuary. Find your ride, reserve your seat, move with intention.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface-container-low p-4 rounded-[2rem]">
            <div className="md:col-span-1 bg-surface-container-lowest p-4 rounded-xl shadow-sm">
              <span className="font-label text-xs uppercase tracking-widest text-outline mb-2 block font-bold">Origin</span>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 font-semibold p-0 text-on-surface" 
                  type="text" 
                  defaultValue="Tunis Marine" 
                />
              </div>
            </div>
            <div className="md:col-span-1 bg-surface-container-lowest p-4 rounded-xl shadow-sm">
              <span className="font-label text-xs uppercase tracking-widest text-outline mb-2 block font-bold">Destination</span>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">near_me</span>
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 font-semibold p-0 text-on-surface" 
                  placeholder="Where to?" 
                  type="text" 
                />
              </div>
            </div>
            <div className="md:col-span-1 bg-surface-container-lowest p-4 rounded-xl shadow-sm">
              <span className="font-label text-xs uppercase tracking-widest text-outline mb-2 block font-bold">Departure Date</span>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 font-semibold p-0 text-on-surface" 
                  type="text" 
                  defaultValue="Today, 24 Oct" 
                />
              </div>
            </div>
            <button className="md:col-span-1 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95 duration-150 py-4 md:py-0">
              <span className="material-symbols-outlined">search</span>
              Find Rides
            </button>
          </div>
        </section>

        <div className="flex items-baseline justify-between mb-8">
          <h3 className="font-headline font-bold text-2xl">Available Louages</h3>
          <span className="font-label text-sm text-outline">14 results found</span>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {DRIVERS.map((driver) => (
            <div 
              key={driver.id} 
              className={`bg-surface-container-lowest p-6 rounded-[1.5rem] shadow-[0_8px_24px_rgba(25,28,30,0.04)] hover:shadow-[0_12px_32px_rgba(25,28,30,0.08)] transition-shadow group ${driver.availability === 0 ? 'opacity-75' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden ${driver.availability === 0 ? 'bg-surface-variant grayscale' : 'bg-secondary-container'}`}>
                    <img 
                      className="w-full h-full object-cover" 
                      src={driver.avatar} 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{driver.name}</span>
                      {driver.isPro && (
                        <span className="bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          PRO
                        </span>
                      )}
                      {driver.rating && (
                        <span className="bg-surface-variant text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {driver.rating} ({driver.reviews})
                        </span>
                      )}
                    </div>
                    <p className="text-on-surface-variant text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">directions_car</span>
                      {driver.vehicle}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-8">
                  <div className="text-center md:text-left">
                    <span className="block text-outline text-[10px] uppercase tracking-widest font-bold mb-1">Departs</span>
                    <span className={`text-2xl font-black ${driver.availability === 0 ? 'text-outline' : 'text-primary'}`}>{driver.departs}</span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="block text-outline text-[10px] uppercase tracking-widest font-bold mb-1">Price</span>
                    <span className="text-2xl font-black text-on-surface">{driver.price}</span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="block text-outline text-[10px] uppercase tracking-widest font-bold mb-1">Availability</span>
                    {driver.availability > 0 ? (
                      <div className="flex gap-1 items-center">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-2 h-6 rounded-full ${i < driver.availability ? 'bg-secondary' : 'bg-outline-variant'}`}></div>
                        ))}
                        <span className={`ml-2 font-bold ${driver.availability === 1 ? 'text-error' : 'text-secondary'}`}>
                          {driver.availability} left
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-outline uppercase tracking-widest text-xs">Full Capacity</span>
                    )}
                  </div>
                </div>

                <button 
                  disabled={driver.availability === 0}
                  className={`px-8 py-4 rounded-xl font-bold transition-all active:scale-90 flex items-center gap-2 ${driver.availability === 0 ? 'bg-surface-container-low text-outline-variant cursor-not-allowed' : 'bg-surface-container-high hover:bg-primary hover:text-white text-on-primary-fixed-variant'}`}
                >
                  {driver.availability === 0 ? 'Sold Out' : (
                    <>
                      Book Seat
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-primary p-12 rounded-[2.5rem] text-white flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-headline font-bold text-4xl mb-6 leading-tight">Priority Boarding<br/>With Louage Pro.</h4>
              <p className="text-primary-fixed-dim text-lg max-w-md">Skip the queue and secure the front seat on any journey. Volta premium members get 15% off all inter-city routes.</p>
            </div>
            <div className="relative z-10 mt-8">
              <button className="bg-white text-primary px-6 py-3 rounded-full font-bold hover:bg-primary-fixed-dim transition-colors">Upgrade Now</button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-primary-container rounded-full opacity-20 blur-3xl"></div>
          </div>
          <div className="bg-surface-container-high p-8 rounded-[2rem] flex flex-col justify-center items-center text-center">
            <span className="material-symbols-outlined text-5xl text-secondary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            <h5 className="font-bold text-xl mb-2">Sustainable City</h5>
            <p className="text-on-surface-variant text-sm">Sharing your ride today saved 4.2kg of CO2 compared to a solo drive. Thank you for moving mindfully.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
