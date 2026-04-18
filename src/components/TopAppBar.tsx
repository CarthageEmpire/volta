import { useVolta } from '../context/VoltaContext';
import { getInitials } from '../services/formatters';

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showSessionActions?: boolean;
}

export default function TopAppBar({
  title,
  subtitle,
  onBack,
  showSessionActions = true,
}: TopAppBarProps) {
  const { currentUser, logoutSession, setAppLocale, state } = useVolta();

  return (
    <header className="sticky top-0 z-50 bg-[rgba(248,249,251,0.88)] px-6 py-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:translate-y-[-1px] active:translate-y-0"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-headline text-2xl font-extrabold tracking-tight text-on-surface">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>

        {showSessionActions && currentUser && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAppLocale(state.locale === 'fr-TN' ? 'ar-TN' : 'fr-TN')}
              className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:block"
            >
              {state.locale === 'fr-TN' ? 'AR' : 'FR'}
            </button>
            <div className="hidden rounded-full bg-white px-4 py-2 text-right shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:block">
              <p className="text-sm font-bold text-slate-900">{currentUser.fullName}</p>
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                {currentUser.role} - {currentUser.city}
              </p>
            </div>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold text-white"
              style={{ backgroundColor: currentUser.avatarColor ?? '#0040a1' }}
              title={currentUser.fullName}
            >
              {getInitials(currentUser.fullName)}
            </div>
            <button
              type="button"
              onClick={logoutSession}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
              title="Se deconnecter"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
