import { Screen } from '../types';

interface TransportSectionTabsProps {
  current: Extract<Screen, 'louage' | 'bus' | 'metro'>;
  navigate: (screen: Screen) => void;
}

const TRANSPORT_TABS = [
  {
    screen: 'louage' as const,
    label: 'Louage',
    caption: 'Trajets interurbains',
    icon: 'route',
    activeClass: 'bg-[rgba(0,109,54,0.12)] text-[#006d36]',
  },
  {
    screen: 'bus' as const,
    label: 'Bus',
    caption: 'Lignes et horaires',
    icon: 'directions_bus',
    activeClass: 'bg-[rgba(0,64,161,0.12)] text-[#0040a1]',
  },
  {
    screen: 'metro' as const,
    label: 'Metro',
    caption: 'Stations et directions',
    icon: 'tram',
    activeClass: 'bg-[rgba(15,118,110,0.12)] text-[#0f766e]',
  },
];

export default function TransportSectionTabs({
  current,
  navigate,
}: TransportSectionTabsProps) {
  return (
    <section className="rounded-[2rem] bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="grid gap-3 md:grid-cols-3">
        {TRANSPORT_TABS.map((tab) => {
          const active = tab.screen === current;

          return (
            <button
              key={tab.screen}
              type="button"
              onClick={() => navigate(tab.screen)}
              className={`flex items-center gap-4 rounded-[1.6rem] px-4 py-4 text-left transition hover:translate-y-[-1px] ${
                active ? tab.activeClass : 'bg-slate-50 text-slate-600'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-white/90 shadow-[0_10px_25px_rgba(15,23,42,0.08)]">
                <span className="material-symbols-outlined">{tab.icon}</span>
              </span>
              <span className="min-w-0">
                <span className="block font-headline text-lg font-extrabold">{tab.label}</span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {tab.caption}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
