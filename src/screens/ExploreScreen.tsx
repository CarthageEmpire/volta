import { Screen } from '../types';
import TopAppBar from '../components/TopAppBar';

interface ExploreScreenProps {
  navigate: (screen: Screen) => void;
}

export default function ExploreScreen({ navigate }: ExploreScreenProps) {
  return (
    <div className="bg-background text-on-background min-h-screen pb-32">
      <TopAppBar title="Volta" onBack={() => navigate('welcome')} />

      <main className="px-6 py-8 max-w-2xl mx-auto">
        <section className="mb-12">
          <h2 className="text-[3.5rem] leading-none font-extrabold tracking-tighter mb-8 text-on-surface">
            Where to <span className="text-primary-container">next?</span>
          </h2>
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline">search</span>
            </div>
            <input 
              className="w-full bg-surface-container-high border-none rounded-full py-5 pl-14 pr-6 text-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-on-surface-variant/50" 
              placeholder="Enter your destination..." 
              type="text" 
            />
          </div>
        </section>

        <section className="mb-12">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('line-details')}
              className="col-span-2 relative h-48 rounded-[1.5rem] overflow-hidden group active:scale-95 transition-transform duration-300"
            >
              <img 
                className="absolute inset-0 w-full h-full object-cover brightness-50 group-hover:scale-110 transition-transform duration-700" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDdr-F7h-k0iIlohmO5DnTCrIEFwYFBuIgMr7_qL2Yct1F0vTNZJWgYEjjU_XLNBv41gLLUcjihIfKasNh-Az757B0rWtaMRqTlion2vCKcgv6JpDI0dBQ7WYSzXp-l6IQFhe7XBYEeHssYlTrH-sARsEF1MLBGPDBDVMaiH4opUdiadtUxQHppVaaafZBFmgAqkMxKdzYsvngQq7a_x3tNx-z2vylg3SuzZOBIOoaZZbLAE3HjgtD4zMsAcE6ge7qQtRUjwT00Fpc" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined">subway</span>
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-xl leading-tight">Metro</p>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Every 4 mins</p>
                </div>
              </div>
            </button>

            <button className="relative h-40 rounded-[1.5rem] overflow-hidden group active:scale-95 transition-transform duration-300 text-left">
              <div className="absolute inset-0 bg-surface-container-low group-hover:bg-surface-container-high transition-colors"></div>
              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                  <span className="material-symbols-outlined">directions_bus</span>
                </div>
                <div>
                  <p className="font-bold text-lg text-on-surface">Bus</p>
                  <p className="text-on-surface-variant text-xs">88 active lines</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => navigate('louage')}
              className="relative h-40 rounded-[1.5rem] overflow-hidden group active:scale-95 transition-transform duration-300 text-left"
            >
              <div className="absolute inset-0 bg-secondary-container/10 group-hover:bg-secondary-container/20 transition-colors"></div>
              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined">directions_car</span>
                </div>
                <div>
                  <p className="font-bold text-lg text-on-surface">Louage</p>
                  <p className="text-on-surface-variant text-xs">Shared inter-city</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold tracking-tight text-on-surface">Quick access</h3>
            <button className="text-primary font-semibold text-sm hover:underline">Edit</button>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-5 group cursor-pointer">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center group-hover:bg-primary-fixed transition-colors">
                <span className="material-symbols-outlined text-outline group-hover:text-primary">home</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-on-surface group-hover:text-primary transition-colors">Home</p>
                <p className="text-on-surface-variant text-sm">Avenue Habib Bourguiba, 1001</p>
              </div>
              <div className="text-right">
                <span className="text-secondary font-bold text-sm">12 min</span>
              </div>
            </div>

            <div className="flex items-center gap-5 group cursor-pointer">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center group-hover:bg-primary-fixed transition-colors">
                <span className="material-symbols-outlined text-outline group-hover:text-primary">work</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-on-surface group-hover:text-primary transition-colors">Digital Hub Office</p>
                <p className="text-on-surface-variant text-sm">Lac II, Tunis</p>
              </div>
              <div className="text-right">
                <span className="text-on-surface-variant font-bold text-sm">24 min</span>
              </div>
            </div>

            <div className="p-6 rounded-[1.5rem] bg-surface-container-lowest shadow-[0_8px_24px_rgba(25,28,30,0.04)] border border-outline-variant/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-bold text-on-surface">Line TGM</span>
                </div>
                <span className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">On Time</span>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Tunis Marine — La Marsa. Next train arrives in <span className="text-on-surface font-bold">5 mins</span>.
              </p>
            </div>
          </div>
        </section>
      </main>

      <button className="fixed bottom-28 right-6 w-16 h-16 rounded-full shadow-2xl bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center active:scale-95 transition-transform">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
      </button>
    </div>
  );
}
