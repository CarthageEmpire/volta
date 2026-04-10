import { Screen } from '../types';

interface WelcomeScreenProps {
  onLogin: () => void;
  onRoleChange: (role: 'passenger' | 'driver') => void;
  currentRole: 'passenger' | 'driver';
}

export default function WelcomeScreen({ onLogin, onRoleChange, currentRole }: WelcomeScreenProps) {
  return (
    <div className="bg-background font-body text-on-background min-h-screen flex flex-col items-center">
      <header className="w-full sticky top-0 z-50 bg-[#f8f9fb]/70 backdrop-blur-xl flex items-center justify-between px-6 py-4 tonal-shift-no-border">
        <div className="flex items-center gap-2">
          <span className="text-[#0056D2] font-black tracking-tighter text-2xl font-headline">Volta</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a className="text-slate-500 font-medium hover:text-[#0056D2] transition-colors" href="#">Help Center</a>
          <button className="bg-primary-container text-white px-6 py-2 rounded-full font-bold transition-all active:scale-95">Support</button>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-6 py-8 md:py-16 flex flex-col md:flex-row items-center gap-12 justify-center lg:gap-16">
        <div className="w-full order-2 md:order-1 space-y-10 md:w-5/12">
          <div className="space-y-4">
            <span className="text-primary font-bold tracking-widest text-xs uppercase block">The Future of Transit</span>
            <h1 className="text-5xl lg:text-7xl font-headline font-extrabold tracking-tight text-on-surface leading-[1.1]">
              Your journey, <span className="text-primary">redefined.</span>
            </h1>
            <p className="text-on-surface-variant text-lg lg:text-xl max-w-md leading-relaxed">
              The simplest way to move through your city.
            </p>
          </div>

          <div className="bg-surface-container-low p-2 rounded-2xl flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onRoleChange('passenger')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl transition-all ${currentRole === 'passenger' ? 'bg-surface-container-lowest text-on-surface shadow-[0_8px_24px_rgba(25,28,30,0.06)] border-2 border-primary/10' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: currentRole === 'passenger' ? "'FILL' 1" : undefined }}>person</span>
                <span className="font-bold">Passenger</span>
              </button>
              <button 
                onClick={() => onRoleChange('driver')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl transition-all ${currentRole === 'driver' ? 'bg-surface-container-lowest text-on-surface shadow-[0_8px_24px_rgba(25,28,30,0.06)] border-2 border-primary/10' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: currentRole === 'driver' ? "'FILL' 1" : undefined }}>directions_car</span>
                <span className="font-bold">Driver</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-on-surface-variant ml-2 mb-1 block">Email Address</span>
                <input 
                  className="w-full bg-surface-container-high border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline" 
                  placeholder="name@example.com" 
                  type="email" 
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-on-surface-variant ml-2 mb-1 block">Password</span>
                <input 
                  className="w-full bg-surface-container-high border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline" 
                  placeholder="••••••••" 
                  type="password" 
                />
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onLogin}
                className="flex-1 hero-gradient text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform"
              >
                Sign In
              </button>
              <button className="flex-1 bg-secondary-container text-on-secondary-container py-4 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform">
                Create Account
              </button>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
              <span className="text-xs font-bold text-outline uppercase tracking-widest">Or continue with</span>
              <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button className="bg-surface-container-high p-4 rounded-2xl flex justify-center hover:bg-surface-container-highest transition-colors">
                <img alt="Google" className="w-6 h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcoNqS_r5lqA3NQ09cPm9h7pGxkXDgg17saFwgaH7-6o2H3fWyhHMY4YeJ3y1jYFLG62_kihG1pVa0yQipGoqP3iCR2qumDrPQTaR0NFGdOXp21YCwjOc8uq5ErTZobLHs8lyjU_IYYuIQfKKGKHLBm1iYRZGaBK43-HHpaag5PrAY8QRLO9Jv9QYKGBcmCRuSzCgJzP5EHqHnMp7s5OKLfLDBCrWEml2CaUesONN9KJzVNqpFVXEpfMQbwnLYSPVgI0BPvDL45ASz" referrerPolicy="no-referrer" />
              </button>
              <button className="bg-surface-container-high p-4 rounded-2xl flex justify-center hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined text-[#1877F2]">social_leaderboard</span>
              </button>
              <button className="bg-surface-container-high p-4 rounded-2xl flex justify-center hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined text-on-surface">ios</span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full order-1 md:order-2 md:w-5/12">
          <div className="relative w-full rounded-[3rem] overflow-hidden shadow-2xl aspect-square max-w-md mx-auto">
            <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10"></div>
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfgy2gPmbdl7aj76UBIyD9O1LFt0rrvK0-yW1mUT1T-9vX84KbZ69LaVOIajWTFtEmoI65SRUJb0DAXM4hLlISYbatYQaKT4YhIQV-g5LXPs65i2LAe5h_Ez66rbqweTno-v5hBZ9kUDiCkXDaPoXEzMJKSdqytkFCbzT7-5wH5OQ_R4jd6T8wTiGp-wvhMBRr7tm2vI6z5mze1u7pP4M5W8d_QyKTtn8LPxBi18L9buhEpKYZT2yww2ujpyNZZaXLKqanL38Doz83" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </main>

      <footer className="w-full mt-auto py-12 px-6 bg-surface-container-high border-t border-transparent">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-[#0056D2] font-black tracking-tighter text-xl font-headline">Volta</span>
            <p className="text-on-surface-variant text-sm">© 2024 Volta Urban Transport Systems.</p>
          </div>
          <nav className="flex gap-8">
            <a className="text-on-surface-variant text-sm font-medium hover:text-primary" href="#">Privacy</a>
            <a className="text-on-surface-variant text-sm font-medium hover:text-primary" href="#">Terms</a>
            <a className="text-on-surface-variant text-sm font-medium hover:text-primary" href="#">Safety</a>
            <a className="text-on-surface-variant text-sm font-medium hover:text-primary" href="#">Accessibility</a>
          </nav>
          <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-primary hover:text-white transition-all">
              <span className="material-symbols-outlined text-lg">language</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
