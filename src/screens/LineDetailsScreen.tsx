import { Screen } from '../types';
import TopAppBar from '../components/TopAppBar';
import { STOPS } from '../constants';

interface LineDetailsScreenProps {
  navigate: (screen: Screen) => void;
}

export default function LineDetailsScreen({ navigate }: LineDetailsScreenProps) {
  return (
    <div className="bg-background text-on-surface min-h-screen pb-32">
      <TopAppBar title="Line M4 Details" onBack={() => navigate('explore')} />

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden">
            <div className="z-10">
              <div className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full mb-4">
                <span className="material-symbols-outlined text-lg">subway</span>
                <span className="font-label text-sm font-bold tracking-wider">ON TIME</span>
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-primary">Green Line Metro</h2>
              <p className="text-on-surface-variant text-lg">Central Station → Emerald Valley</p>
            </div>
            <div className="mt-6 md:mt-0 z-10">
              <button 
                onClick={() => navigate('tickets')}
                className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-xl font-bold text-lg shadow-[0_8px_24px_rgba(0,86,210,0.2)] hover:shadow-none transition-all active:scale-95"
              >
                Buy Ticket $4.50
              </button>
            </div>
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"></div>
          </section>

          <section className="rounded-xl overflow-hidden h-80 bg-surface-container-high relative">
            <div className="absolute inset-0 z-0">
              <img 
                alt="City Map Route" 
                className="w-full h-full object-cover grayscale contrast-125 opacity-40" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8jpsBCQOoioAsZrfREku55NKeZs1ePO9svDF1j-_f-VrrB3FFat3AkXikIAo2OgbyZPXjQFrg1cZwTm7LrkWPZwJyxPBEebvNN2a1IZNgNpihnGgEnBg6ZgvjhzzU2IRmJ4ypKnP9YAsTV8YWL9R53KvY74YCXM9OoLaahA6NXUpXeaxbWGOP77E8f4StZY01ZVDow48_dN2SPP_x7lIarptIbQthzo4KrUs_t5e8qxfUINg9poHjx0WjYDKCXNJoD4WzvkxiQyIZ" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent"></div>
            <div className="relative z-10 p-6 h-full flex flex-col justify-between">
              <div className="flex justify-end">
                <button className="w-12 h-12 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                  <span className="material-symbols-outlined text-on-surface">fullscreen</span>
                </button>
              </div>
              <div className="bg-surface-container-lowest/90 backdrop-blur-md p-4 rounded-xl inline-flex items-center gap-4 max-w-xs">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>navigation</span>
                </div>
                <div>
                  <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Next Train In</p>
                  <p className="font-headline font-bold text-xl text-secondary">3 minutes</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-xl font-bold px-2">Line Stops & Schedule</h3>
          <div className="space-y-0 relative">
            <div className="absolute left-10 top-8 bottom-8 w-1 bg-surface-container-highest rounded-full"></div>
            
            {STOPS.map((stop) => (
              <div key={stop.id} className={`group flex items-start gap-6 p-4 rounded-xl transition-colors ${stop.status === 'current' ? 'bg-surface-container-lowest shadow-[0_8px_24px_rgba(25,28,30,0.04)] ring-1 ring-primary/5' : 'hover:bg-surface-container-low'}`}>
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-background ${stop.status === 'current' ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                    {stop.status === 'departed' ? (
                      <span className="material-symbols-outlined text-slate-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    ) : stop.status === 'current' ? (
                      <span className="material-symbols-outlined text-on-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>directions_subway</span>
                    ) : (
                      <div className={`w-3 h-3 rounded-full ${stop.id === '3' ? 'bg-primary/40' : 'bg-primary/20'}`}></div>
                    )}
                  </div>
                  <span className={`font-label text-xs mt-2 ${stop.status === 'departed' ? 'text-slate-400 font-bold' : stop.status === 'current' ? 'text-primary font-black' : 'text-on-surface-variant font-bold'}`}>
                    {stop.time}
                  </span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-bold text-lg ${stop.status === 'departed' ? 'text-slate-400 line-through' : 'text-on-surface'}`}>
                      {stop.name}
                    </h4>
                    {stop.isNow && (
                      <span className="bg-secondary/10 text-secondary text-[10px] font-black px-2 py-0.5 rounded uppercase">Now</span>
                    )}
                  </div>
                  <p className={`text-sm ${stop.status === 'departed' ? 'text-slate-400' : 'text-on-surface-variant'}`}>
                    {stop.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary-container text-on-primary-container p-6 rounded-xl relative overflow-hidden group">
            <div className="relative z-10">
              <p className="font-label text-xs uppercase tracking-widest opacity-80 mb-1">Commuter Plus</p>
              <h4 className="font-bold text-xl mb-3">Save 20% on Weekly Passes</h4>
              <button className="bg-surface-container-lowest text-primary px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform">Learn More</button>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">loyalty</span>
          </div>
        </div>
      </main>
    </div>
  );
}
