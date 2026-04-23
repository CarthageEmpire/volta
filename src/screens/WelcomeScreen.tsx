import { FormEvent, useEffect, useState } from 'react';
import { TUNISIAN_CITIES } from '../constants';
import { useVolta } from '../context/VoltaContext';
import { Screen } from '../types';

interface WelcomeScreenProps {
  navigate: (screen: Screen) => void;
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-.8 2.4-1.7 3.2l3 2.3c1.8-1.7 2.8-4.1 2.8-6.9 0-.7-.1-1.3-.2-1.9H12Z"
      />
      <path
        fill="#34A853"
        d="M12 21c2.7 0 5-.9 6.7-2.5l-3-2.3c-.8.6-2 1-3.7 1-2.8 0-5.1-1.9-5.9-4.4l-3.1 2.4C4.7 18.8 8.1 21 12 21Z"
      />
      <path
        fill="#4A90E2"
        d="M6.1 12.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8l-3.1-2.4C2.4 8 2 9.5 2 11s.4 3 1 4.2l3.1-2.4Z"
      />
      <path
        fill="#FBBC05"
        d="M12 4.8c1.5 0 2.9.5 3.9 1.5l2.9-2.9C17 1.8 14.7 1 12 1 8.1 1 4.7 3.2 3 6.8l3.1 2.4c.8-2.5 3.1-4.4 5.9-4.4Z"
      />
    </svg>
  );
}

function getDefaultScreenForRole(screenRole?: 'passenger' | 'driver' | 'admin') {
  if (screenRole === 'driver') {
    return 'driver-dashboard' as const;
  }

  if (screenRole === 'admin') {
    return 'admin-review' as const;
  }

  return 'explore' as const;
}

export default function WelcomeScreen({ navigate }: WelcomeScreenProps) {
  const { currentUser, loginWithEmail, loginWithGoogle, signupAccount } = useVolta();
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

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    navigate(getDefaultScreenForRole(currentUser.role));
  }, [currentUser, navigate]);

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
        ? 'Account created. Complete driver verification next.'
        : 'Account created successfully.',
    );
    navigate(result.nextScreen ?? 'explore');
    setIsSubmitting(false);
  };

  const submitGoogleLogin = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = await loginWithGoogle();
    if (!result.ok) {
      setFeedback(result.message ?? '');
      setIsSubmitting(false);
      return;
    }

    if (result.nextScreen) {
      setFeedback('');
      navigate(result.nextScreen);
      setIsSubmitting(false);
      return;
    }

    setFeedback(result.message ?? 'Signing in with Google...');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,64,161,0.12),_transparent_28%),linear-gradient(180deg,_#f8f9fb_0%,_#ffffff_48%,_#eef5ff_100%)] px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <section className="max-w-xl">
          <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-primary shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            Volta Tunisia
          </span>
          <h1 className="mt-6 font-headline text-5xl font-extrabold tracking-tight text-slate-950 md:text-7xl">
            Tunisian transport
            <br />
            in one app
            <br />
            <span className="text-primary">simple and role-aware.</span>
          </h1>
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
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-full px-5 py-2 text-sm font-bold ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign up
            </button>
          </div>

          <h2 className="mt-8 font-headline text-3xl font-extrabold tracking-tight text-slate-950">
            {mode === 'login' ? 'Sign in with email and password' : 'Create your account'}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {mode === 'login'
              ? 'Sign in quickly and continue your trip.'
              : 'Sign up with email and choose your role.'}
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
                <span className="mb-2 block text-sm font-semibold text-slate-600">Password</span>
                <input
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, password: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  placeholder="Password"
                  type="password"
                  autoComplete="current-password"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-[1.5rem] bg-[linear-gradient(135deg,_#0040a1_0%,_#0056d2_100%)] py-4 font-headline text-lg font-extrabold text-white"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  or
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <button
                type="button"
                onClick={() => void submitGoogleLogin()}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] px-5 py-4 font-headline text-lg font-extrabold text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:shadow-[0_16px_38px_rgba(15,23,42,0.10)] disabled:opacity-60"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <GoogleIcon />
                </span>
                {isSubmitting ? 'Signing in with Google...' : 'Continue with Google'}
              </button>
              <p className="text-center text-xs leading-6 text-slate-500">
                Uses the Google provider enabled in Firebase Authentication.
              </p>
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
                    {role === 'passenger' ? 'Passenger' : 'Driver'}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Full name</span>
                <input
                  value={signupForm.fullName}
                  onChange={(event) =>
                    setSignupForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  placeholder="Full name"
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
                  <span className="mb-2 block text-sm font-semibold text-slate-600">Phone</span>
                  <input
                    value={signupForm.phone}
                    onChange={(event) =>
                      setSignupForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                    placeholder="Phone"
                    type="tel"
                    autoComplete="tel"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-600">City</span>
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
                  <span className="mb-2 block text-sm font-semibold text-slate-600">Password</span>
                  <input
                    value={signupForm.password}
                    onChange={(event) =>
                      setSignupForm((current) => ({ ...current, password: event.target.value }))
                    }
                    className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                    placeholder="Password"
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
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
