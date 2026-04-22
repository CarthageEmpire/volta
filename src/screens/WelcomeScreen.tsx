import { FormEvent, useState } from 'react';
import { TUNISIAN_CITIES } from '../constants';
import { useVolta } from '../context/VoltaContext';
import { Screen } from '../types';

interface WelcomeScreenProps {
  navigate: (screen: Screen) => void;
}

export default function WelcomeScreen({ navigate }: WelcomeScreenProps) {
  const { loginWithEmail, signupAccount, resetDemo } = useVolta();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [signupForm, setSignupForm] = useState({
    role: 'passenger' as 'passenger' | 'driver',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    city: 'Tunis',
  });

  const fillSeedAccount = (email: string, password: string) => {
    setMode('login');
    setFeedback('');
    setLoginForm({ email, password });
  };

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = await loginWithEmail(loginForm);
    if (!result.ok) {
      setFeedback(result.message ?? '');
      setIsSubmitting(false);
      return;
    }
    setFeedback('');
    navigate(result.nextScreen ?? 'explore');
    setIsSubmitting(false);
  };

  const submitSignup = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = await signupAccount(signupForm);
    if (!result.ok) {
      setFeedback(result.message ?? '');
      setIsSubmitting(false);
      return;
    }
    setFeedback(
      signupForm.role === 'driver'
        ? 'Compte cree. Finalisez la verification conducteur.'
        : 'Compte cree avec succes.',
    );
    navigate(result.nextScreen ?? 'explore');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,64,161,0.12),_transparent_28%),linear-gradient(180deg,_#f8f9fb_0%,_#ffffff_48%,_#eef5ff_100%)] px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <section className="max-w-xl">
          <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-primary shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            Volta Tunisie
          </span>
          <h1 className="mt-6 font-headline text-5xl font-extrabold tracking-tight text-slate-950 md:text-7xl">
            Transport tunisien
            <br />
            dans une app
            <br />
            <span className="text-primary">simple et role-aware.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-500">
            Authentification, verification conducteur, louage, tickets QR, paiement et
            suivi metro/bus dans un seul flux coherent.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Metro / Bus</p>
              <p className="mt-3 font-bold text-slate-900">Suivi live</p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Louage</p>
              <p className="mt-3 font-bold text-slate-900">Paiement retenu</p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Conducteurs</p>
              <p className="mt-3 font-bold text-slate-900">Verification admin</p>
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">Comptes seed</p>
            <div className="mt-4 space-y-3 text-sm">
              <button
                type="button"
                onClick={() => fillSeedAccount('imen@volta.tn', 'volta123')}
                className="block text-left text-white/85"
              >
                Passager: imen@volta.tn / volta123
              </button>
              <button
                type="button"
                onClick={() => fillSeedAccount('hamed@volta.tn', 'volta123')}
                className="block text-left text-white/85"
              >
                Conducteur: hamed@volta.tn / volta123
              </button>
              <button
                type="button"
                onClick={() => fillSeedAccount('admin@volta.tn', 'admin123')}
                className="block text-left text-white/85"
              >
                Admin: admin@volta.tn / admin123
              </button>
            </div>
            <button
              type="button"
              onClick={resetDemo}
              className="mt-5 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900"
            >
              Reinitialiser la session locale
            </button>
          </div>
        </section>

        <section className="w-full max-w-xl rounded-[2.4rem] bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.12)] md:p-8">
          <div className="inline-flex rounded-full bg-slate-100 p-1.5">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-full px-5 py-2 text-sm font-bold ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-full px-5 py-2 text-sm font-bold ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Inscription
            </button>
          </div>

          <h2 className="mt-8 font-headline text-3xl font-extrabold tracking-tight text-slate-950">
            {mode === 'login' ? 'Connexion email + mot de passe' : 'Inscription rapide'}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {mode === 'login'
              ? 'Connexion simplifiee, sans support/help center inutile sur cette page.'
              : 'Inscription par email avec choix du role passager ou conducteur.'}
          </p>

          {feedback && (
            <div className="mt-6 rounded-[1.4rem] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              {feedback}
            </div>
          )}

          {mode === 'login' ? (
            <form className="mt-8 space-y-4" onSubmit={submitLogin}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Email</span>
                <input
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  placeholder="Email"
                  type="email"
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Mot de passe</span>
                <input
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, password: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  placeholder="Mot de passe"
                  type="password"
                  autoComplete="current-password"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-[1.5rem] bg-[linear-gradient(135deg,_#0040a1_0%,_#0056d2_100%)] py-4 font-headline text-lg font-extrabold text-white"
              >
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={submitSignup}>
              <div className="grid grid-cols-2 gap-3 rounded-[1.4rem] bg-slate-100 p-1.5">
                {(['passenger', 'driver'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSignupForm((current) => ({ ...current, role }))}
                    className={`rounded-[1.1rem] px-4 py-3 text-sm font-bold ${
                      signupForm.role === role ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {role === 'passenger' ? 'Passager' : 'Conducteur'}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Nom complet</span>
                <input
                  value={signupForm.fullName}
                  onChange={(event) =>
                    setSignupForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  placeholder="Nom complet"
                  type="text"
                  autoComplete="name"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-600">Email</span>
                  <input
                    value={signupForm.email}
                    onChange={(event) =>
                      setSignupForm((current) => ({ ...current, email: event.target.value }))
                    }
                    className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                    placeholder="Email"
                    type="email"
                    autoComplete="email"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-600">Telephone</span>
                  <input
                    value={signupForm.phone}
                    onChange={(event) =>
                      setSignupForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                    placeholder="Telephone"
                    type="tel"
                    autoComplete="tel"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-600">Ville</span>
                  <select
                    value={signupForm.city}
                    onChange={(event) =>
                      setSignupForm((current) => ({ ...current, city: event.target.value }))
                    }
                    className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  >
                    {TUNISIAN_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-600">Mot de passe</span>
                  <input
                    value={signupForm.password}
                    onChange={(event) =>
                      setSignupForm((current) => ({ ...current, password: event.target.value }))
                    }
                    className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                    placeholder="Mot de passe"
                    type="password"
                    autoComplete="new-password"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-[1.5rem] bg-[linear-gradient(135deg,_#006d36_0%,_#0f9d58_100%)] py-4 font-headline text-lg font-extrabold text-white"
              >
                {isSubmitting ? 'Creation...' : 'Creer mon compte'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
