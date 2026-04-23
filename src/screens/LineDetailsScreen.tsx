import TopAppBar from '../components/TopAppBar';
import { useVolta } from '../context/VoltaContext';
import { formatDateTime, formatTnd } from '../services/formatters';
import { Screen } from '../types';

interface LineDetailsScreenProps {
  navigate: (screen: Screen) => void;
}

export default function LineDetailsScreen({ navigate }: LineDetailsScreenProps) {
  const { state, setLine, startLinePayment } = useVolta();
  const line = state.lines.find((candidate) => candidate.id === state.selectedLineId) ?? state.lines[0];

  if (!line) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-background pb-36 sm:pb-32">
        <TopAppBar
          title="Live lines"
          subtitle="Loading lines..."
          onBack={() => navigate('explore')}
        />
        <main className="mx-auto w-full max-w-4xl min-w-0 px-4 py-6 sm:px-6 sm:py-8">
          <div className="rounded-[2rem] bg-white p-6 text-sm text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            Lines are syncing from Firestore.
          </div>
        </main>
      </div>
    );
  }

  const vehicles = state.liveVehicles.filter((vehicle) => vehicle.lineId === line.id);
  const backScreen = line.mode === 'bus' ? 'bus' : 'metro';
  const primaryVehicle = vehicles[0];
  const activeStopIndex = primaryVehicle
    ? Math.max(
        0,
        line.stops.findIndex((stop) => stop.id === primaryVehicle.nextStopId),
      )
    : -1;
  const stopCount = Math.max(line.stops.length, 1);
  const stopGridStyle = {
    gridTemplateColumns: `repeat(${stopCount}, minmax(6.5rem, 1fr))`,
  };
  const stopMapMinWidth = `${Math.max(stopCount * 104, 320)}px`;

  const buyTicket = async () => {
    const result = await startLinePayment(line.id);
    if (result.ok) {
      navigate('payment');
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background pb-36 sm:pb-32">
      <TopAppBar
        title="Live lines"
        subtitle="Tunisian metro and bus with ETA"
        onBack={() => navigate(backScreen)}
      />

      <main className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6 overflow-x-hidden px-4 py-6 sm:gap-8 sm:px-6 sm:py-8">
        <section className="min-w-0 overflow-hidden rounded-[2rem] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch]">
            <div className="flex min-w-max gap-3">
              {state.lines.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLine(item.id)}
                  className="max-w-[calc(100vw-5.5rem)] shrink-0 truncate rounded-full px-4 py-3 text-left text-sm leading-5 font-bold sm:max-w-none"
                  style={{
                    backgroundColor: item.id === line.id ? item.color : '#f1f5f9',
                    color: item.id === line.id ? '#ffffff' : '#334155',
                  }}
                  title={`${item.code} - ${item.origin} to ${item.destination}`}
                >
                  {item.code} - {item.origin} -&gt; {item.destination}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="min-w-0 overflow-hidden rounded-[2.2rem] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                  {line.mode}
                </p>
                <h2 className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  {line.name} {line.code}
                </h2>
                <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-500">
                  {line.routeLabel}
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  {line.operatorName ?? 'Operator not listed'}
                </p>
                {line.servicePattern && (
                  <p className="mt-1 break-words text-sm text-slate-500">{line.servicePattern}</p>
                )}
                {line.verificationNotes && (
                  <p className="mt-2 max-w-2xl break-words text-xs leading-5 text-amber-700">
                    {line.verificationNotes}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={buyTicket}
                className="w-full shrink-0 self-start rounded-full px-5 py-3 text-sm font-bold text-white sm:w-auto"
                style={{ backgroundColor: line.color }}
              >
                Buy {formatTnd(line.fareTnd)}
              </button>
            </div>

            <div className="mt-6 min-w-0 rounded-[1.8rem] bg-slate-50 p-4 sm:p-6">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-400">
                Route map
              </p>
              {primaryVehicle?.updatedAt ? (
                <div className="mt-4 min-w-0 rounded-[1.2rem] bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">Last live update:</span>{' '}
                  {formatDateTime(primaryVehicle.updatedAt, state.locale)}
                  {primaryVehicle.latitude !== undefined && primaryVehicle.longitude !== undefined ? (
                    <span className="break-all">
                      {' '}
                      - {primaryVehicle.latitude.toFixed(4)}, {primaryVehicle.longitude.toFixed(4)}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-5 min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-[1.6rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(226,232,240,0.95))] px-4 py-5 [-webkit-overflow-scrolling:touch] sm:px-6 sm:py-6">
                <div className="w-max min-w-full max-w-none space-y-5" style={{ minWidth: stopMapMinWidth }}>
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
                      <div
                        key={stop.id}
                        className="flex min-h-[78px] flex-col items-center px-1 text-center"
                      >
                        <p
                          className={`max-w-[6.5rem] text-sm font-bold leading-5 text-slate-900 ${
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

          <div className="min-w-0 overflow-hidden rounded-[2.2rem] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Stops</p>
            {primaryVehicle ? (
              <div className="mt-4 rounded-[1.4rem] bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <p className="font-semibold text-slate-900">
                  {primaryVehicle.label} is currently sharing location.
                </p>
                <p className="mt-1">
                  Current ETA: {primaryVehicle.etaMinutes} min
                  {primaryVehicle.updatedAt ? ` - updated ${formatDateTime(primaryVehicle.updatedAt, state.locale)}` : ''}
                </p>
              </div>
            ) : null}
            <div className="mt-5 space-y-4">
              {line.stops.map((stop) => (
                <div key={stop.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                  <div className="flex min-w-0 items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="break-words font-bold text-slate-900">{stop.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        ETA: {stop.etaMinutes} min
                      </p>
                    </div>
                    <p className="shrink-0 font-bold text-slate-900">{stop.plannedTime}</p>
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
