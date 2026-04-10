import { Screen } from '../types';
import TopAppBar from '../components/TopAppBar';

interface CreateTripScreenProps {
  navigate: (screen: Screen) => void;
}

export default function CreateTripScreen({ navigate }: CreateTripScreenProps) {
  return (
    <div className="bg-background text-on-surface min-h-screen pb-32">
      <TopAppBar title="Volta" onBack={() => navigate('driver-dashboard')} />

      <main className="max-w-xl mx-auto px-6 mt-8">
        <header className="mb-10">
          <span className="font-label text-sm uppercase tracking-[0.2em] text-secondary font-semibold mb-2 block">Driver Dashboard</span>
          <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface leading-tight">Create a New Trip</h2>
          <p className="text-on-surface-variant mt-2 text-lg">Fill in your route details to find passengers.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 bg-surface-container-lowest p-6 rounded-3xl shadow-[0_-8px_24px_rgba(25,28,30,0.03)] flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">route</span>
              <h3 className="font-headline font-bold text-xl">Journey Details</h3>
            </div>
            <div className="space-y-5">
              <div className="relative">
                <label className="absolute -top-2.5 left-4 bg-surface-container-lowest px-2 text-xs font-semibold text-primary">Origin City</label>
                <div className="flex items-center bg-surface-container-high rounded-2xl px-4 py-4 group focus-within:bg-surface-container-lowest focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <span className="material-symbols-outlined text-on-surface-variant mr-3">location_on</span>
                  <input className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-medium placeholder:text-on-surface-variant/50" placeholder="e.g. Tunis Centre" type="text" />
                </div>
              </div>
              <div className="relative">
                <label className="absolute -top-2.5 left-4 bg-surface-container-lowest px-2 text-xs font-semibold text-primary">Destination</label>
                <div className="flex items-center bg-surface-container-high rounded-2xl px-4 py-4 group focus-within:bg-surface-container-lowest focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <span className="material-symbols-outlined text-on-surface-variant mr-3">flag</span>
                  <input className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-medium placeholder:text-on-surface-variant/50" placeholder="e.g. Sousse Station" type="text" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_-8px_24px_rgba(25,28,30,0.03)]">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 block">Departure Time</label>
            <div className="flex items-center bg-surface-container-high rounded-2xl px-4 py-4 group focus-within:bg-surface-container-lowest transition-all">
              <span className="material-symbols-outlined text-on-surface-variant mr-3">schedule</span>
              <input className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-bold" type="time" />
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_-8px_24px_rgba(25,28,30,0.03)]">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 block">Available Seats</label>
            <div className="flex items-center justify-between bg-surface-container-high rounded-2xl px-4 py-3">
              <button className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-on-surface">remove</span>
              </button>
              <span className="text-2xl font-black text-primary">4</span>
              <button className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center active:scale-90 transition-transform">
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-2 bg-surface-container-lowest p-6 rounded-3xl shadow-[0_-8px_24px_rgba(25,28,30,0.03)]">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-secondary">directions_car</span>
              <h3 className="font-headline font-bold text-xl">Vehicle Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-container-high rounded-2xl px-4 py-4">
                <input className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-medium placeholder:text-on-surface-variant/50" placeholder="Car Model (e.g. VW Transporter)" type="text" />
              </div>
              <div className="bg-surface-container-high rounded-2xl px-4 py-4">
                <input className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-medium placeholder:text-on-surface-variant/50" placeholder="License Plate Number" type="text" />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-[2rem] -z-10 group-hover:opacity-100 opacity-50 transition-opacity"></div>
            <div className="border-2 border-dashed border-outline-variant rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 hover:border-primary transition-colors">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">add_a_photo</span>
              </div>
              <div className="text-center">
                <p className="font-headline font-bold text-lg">Upload Vehicle Photo</p>
                <p className="text-sm text-on-surface-variant">JPG, PNG up to 10MB. Front view preferred.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 mb-20">
          <button 
            onClick={() => navigate('driver-dashboard')}
            className="w-full py-5 rounded-2xl bg-gradient-to-br from-[#0040a1] to-[#0056d2] text-white font-headline font-extrabold text-xl shadow-[0_12px_32px_rgba(0,86,210,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span>Publish Trip Ad</span>
            <span className="material-symbols-outlined">rocket_launch</span>
          </button>
          <p className="text-center text-on-surface-variant text-sm mt-4">By publishing, you agree to our <span className="text-primary font-semibold underline">Safety Guidelines</span></p>
        </div>
      </main>
    </div>
  );
}
