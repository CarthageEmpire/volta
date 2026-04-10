import { Screen } from '../types';
import TopAppBar from '../components/TopAppBar';

interface TicketsScreenProps {
  navigate: (screen: Screen) => void;
}

export default function TicketsScreen({ navigate }: TicketsScreenProps) {
  return (
    <div className="bg-background text-on-background font-body min-h-screen pb-32">
      <TopAppBar title="Volta" onBack={() => navigate('explore')} />

      <main className="px-6 py-8 max-w-2xl mx-auto space-y-10">
        <section className="space-y-2">
          <p className="font-label text-on-surface-variant font-medium uppercase tracking-widest text-[11px]">Seamless Transit</p>
          <h2 className="font-headline font-extrabold text-4xl tracking-tighter text-on-surface leading-none">
            Choose Your <br/>
            <span className="text-primary italic">Movement.</span>
          </h2>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="group relative flex flex-col justify-between p-6 bg-surface-container-lowest rounded-xl text-left transition-all hover:shadow-[0_8px_24px_rgba(25,28,30,0.06)] active:scale-95">
            <div className="flex justify-between items-start mb-12">
              <div className="w-12 h-12 bg-primary-fixed flex items-center justify-center rounded-full">
                <span className="material-symbols-outlined text-primary">confirmation_number</span>
              </div>
              <span className="font-headline font-extrabold text-2xl text-on-surface">$2.50</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-xl text-on-surface">Single Journey</h3>
              <p className="text-on-surface-variant text-sm mt-1">Valid for 90 minutes after first scan.</p>
            </div>
          </button>

          <button className="relative flex flex-col justify-between p-6 bg-secondary-container rounded-xl text-left transition-all shadow-[0_8px_24px_rgba(0,109,54,0.12)] border-2 border-secondary scale-[1.02] z-10">
            <div className="flex justify-between items-start mb-12">
              <div className="w-12 h-12 bg-white/40 flex items-center justify-center rounded-full">
                <span className="material-symbols-outlined text-secondary">calendar_today</span>
              </div>
              <span className="font-headline font-extrabold text-2xl text-secondary">$8.00</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-xl text-secondary">Daily Pass</h3>
              <p className="text-on-secondary-container text-sm mt-1">Unlimited travel for 24 hours.</p>
            </div>
            <div className="absolute top-4 right-4">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </button>

          <button className="flex flex-col justify-between p-6 bg-surface-container-lowest rounded-xl text-left transition-all hover:shadow-[0_8px_24px_rgba(25,28,30,0.06)] active:scale-95 md:col-span-2">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-tertiary-fixed flex items-center justify-center rounded-full">
                  <span className="material-symbols-outlined text-tertiary">auto_mode</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-xl text-on-surface">Weekly Commuter</h3>
                  <p className="text-on-surface-variant text-sm">7 days of limitless city access.</p>
                </div>
              </div>
              <span className="font-headline font-extrabold text-2xl text-on-surface">$32.00</span>
            </div>
          </button>
        </section>

        <section className="space-y-4">
          <h4 className="font-headline font-bold text-lg px-2">Payment Method</h4>
          <div className="bg-surface-container-high p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px] text-white font-bold">VISA</div>
                <span className="font-medium text-on-surface">•••• 4242</span>
              </div>
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>radio_button_checked</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-black rounded flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-sm">ios</span>
                </div>
                <span className="font-medium text-on-surface-variant">Apple Pay</span>
              </div>
              <span className="material-symbols-outlined text-outline">radio_button_unchecked</span>
            </div>
          </div>
        </section>

        <section className="pt-4">
          <button className="w-full py-5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold text-lg shadow-[0_8px_32px_rgba(0,86,210,0.25)] flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
            <span>Confirm and Purchase</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <p className="text-center text-xs text-on-surface-variant mt-4 px-8">By confirming, you agree to our terms of service and city transit regulations.</p>
        </section>

        <section className="bg-surface-container-lowest/80 backdrop-blur-lg rounded-2xl p-8 flex flex-col items-center border border-white/40 shadow-xl mt-12 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="mb-6 text-center">
            <span className="text-secondary font-headline font-bold tracking-widest text-xs uppercase">Preview Draft</span>
            <h4 className="font-headline font-bold text-xl mt-1">Your Virtual Pass</h4>
          </div>
          
          <div className="w-48 h-48 bg-white p-4 rounded-xl shadow-inner flex items-center justify-center relative">
            <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full opacity-80">
              <div className="bg-on-surface col-span-2 row-span-2 rounded-sm"></div>
              <div className="bg-on-surface"></div>
              <div className="bg-on-surface"></div>
              <div className="bg-on-surface"></div>
              <div className="bg-on-surface"></div>
              <div className="bg-on-surface"></div>
              <div className="bg-on-surface col-span-2 row-span-2 rounded-sm place-self-end"></div>
              <div className="bg-on-surface"></div>
              <div className="bg-on-surface"></div>
              <div className="bg-on-surface"></div>
              <div className="bg-on-surface col-span-2 row-span-2 rounded-sm self-end"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white p-1 rounded-full">
                <span className="material-symbols-outlined text-primary text-3xl">directions_car</span>
              </div>
            </div>
          </div>
          <div className="mt-8 w-full border-t border-dashed border-outline-variant pt-6 flex justify-between items-center">
            <div className="text-left">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">Terminal</p>
              <p className="font-headline font-extrabold text-sm">Zone A-C</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">Expires</p>
              <p className="font-headline font-extrabold text-sm">24h after scan</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
