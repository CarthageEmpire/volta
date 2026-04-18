import TopAppBar from '../components/TopAppBar';
import { useVolta } from '../context/VoltaContext';
import { formatTnd } from '../services/formatters';
import { Screen } from '../types';

interface LineDetailsScreenProps {
  navigate: (screen: Screen) => void;
}

export default function LineDetailsScreen({ navigate }: LineDetailsScreenProps) {
  const { state, setLine, startLinePayment } = useVolta();
  const line = state.lines.find((candidate) => candidate.id === state.selectedLineId) ?? state.lines[0];
  const vehicles = state.liveVehicles.filter((vehicle) => vehicle.lineId === line.id);
  const backScreen = line.mode === 'bus' ? 'bus' : 'metro';
  const primaryVehicle = vehicles[0];
  const activeStopIndex = primaryVehicle
    ? Math.max(
        0,
        line.stops.findIndex((stop) => stop.id === primaryVehicle.nextStopId),
      )
    : -1;
  const stopGridStyle = {
    gridTemplateColumns: `repeat(${Math.max(line.stops.length, 1)}, minmax(0, 1fr))`,
  };

  const buyTicket = () => {
    const result = startLinePayment(line.id);
    if (result.ok) {
      navigate('payment');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-36 sm:pb-32">
      <TopAppBar
        title="Lignes live"
        subtitle="Metro et bus tunisiens avec ETA"
        onBack={() => navigate(backScreen)}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8">
        <section className="rounded-[2rem] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex flex-wrap gap-3">
            {state.lines.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLine(item.id)}
                className="rounded-full px-4 py-3 text-left text-sm leading-5 font-bold"
                style={{
                  backgroundColor: item.id === line.id ? item.color : '#f1f5f9',
                  color: item.id === line.id ? '#ffffff' : '#334155',
                }}
              >
                {item.code} - {item.origin} -&gt; {item.destination}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2.2rem] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                  {line.mode}
                </p>
                <h2 className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  {line.name} {line.code}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{line.routeLabel}</p>
              </div>
              <button
                type="button"
                onClick={buyTicket}
                className="w-full rounded-full px-5 py-3 text-sm font-bold text-white sm:w-auto"
                style={{ backgroundColor: line.color }}
              >
                Acheter {formatTnd(line.fareTnd)}
              </button>
            </div>

            <div className="mt-6 rounded-[1.8rem] bg-slate-50 p-4 sm:p-6">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-400">
                Carte simplifiee
              </p>
              <div className="mt-5 overflow-hidden rounded-[1.6rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(226,232,240,0.95))] px-4 py-5 sm:px-6 sm:py-6">
                <div className="space-y-5">
                  {primaryVehicle && (
                    <div className="grid gap-3" style={stopGridStyle}>
                      {line.stops.map((stop, index) => (
                        <div
                          key={`${stop.id}-live`}
                          className={`flex min-h-[76px] justify-center ${
                            index === activeStopIndex ? 'items-start' : 'items-end'
                          }`}
                        >
                          {index === activeStopIndex && (
                            <div className="flex max-w-[7rem] flex-col items-center gap-2 text-center">
                              <div
                                className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_14px_35px_rgba(15,23,42,0.18)]"
                                style={{ backgroundColor: line.color }}
                                aria-hidden="true"
                              >
                                <span className="material-symbols-outlined text-[22px]">
                                  {primaryVehicle.mode === 'metro' ? 'tram' : 'directions_bus'}
                                </span>
                              </div>
                              <div className="rounded-2xl bg-white px-3 py-2 text-[11px] font-bold leading-4 text-slate-700 shadow-sm sm:text-xs">
                                {primaryVehicle.label}
                                <br />
                                {primaryVehicle.etaMinutes} min
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative px-2">
                    <div className="absolute left-4 right-4 top-2.5 h-[5px] rounded-full bg-slate-200" />
                    <div className="relative grid items-start gap-3" style={stopGridStyle}>
                      {line.stops.map((stop, index) => {
                        const isActiveStop = index === activeStopIndex;
                        const isOriginStop = index === 0;

                        return (
                          <div key={`${stop.id}-marker`} className="flex justify-center">
                            <div
                              className={`h-5 w-5 rounded-full border-4 border-white shadow-sm transition-transform ${
                                isActiveStop ? 'scale-110 ring-4 ring-white/75' : ''
                              }`}
                              style={{
                                backgroundColor:
                                  isActiveStop || isOriginStop ? line.color : '#cbd5e1',
                              }}
                              aria-hidden="true"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid items-start gap-3" style={stopGridStyle}>
                    {line.stops.map((stop, index) => (
                      <div key={stop.id} className="flex min-h-[78px] flex-col items-center px-1 text-center">
                        <p
                          className={`max-w-[5.75rem] text-sm font-bold leading-5 text-slate-900 sm:max-w-none ${
                            index === activeStopIndex ? 'text-slate-950' : ''
                          }`}
                        >
                          {stop.name}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{stop.plannedTime}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.2rem] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Arrets</p>
            <div className="mt-5 space-y-4">
              {line.stops.map((stop) => (
                <div key={stop.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900">{stop.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        ETA: {stop.etaMinutes} min
                      </p>
                    </div>
                    <p className="font-bold text-slate-900">{stop.plannedTime}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
