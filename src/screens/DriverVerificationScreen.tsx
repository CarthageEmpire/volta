import { FormEvent, useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import { DRIVER_DOCUMENT_LABELS, TUNISIAN_CITIES } from '../constants';
import { useVolta } from '../context/VoltaContext';
import { Screen } from '../types';

interface DriverVerificationScreenProps {
  navigate: (screen: Screen) => void;
}

export default function DriverVerificationScreen({ navigate }: DriverVerificationScreenProps) {
  const { currentUser, submitVerification, state } = useVolta();
  const [feedback, setFeedback] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(Boolean(currentUser?.phoneVerified));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState({
    driving_license: '',
    national_id: '',
    vehicle_insurance: '',
    vehicle_registration: '',
  });
  const [form, setForm] = useState({
    fullName: currentUser?.fullName ?? '',
    dateOfBirth: currentUser?.dateOfBirth ?? '1990-01-01',
    gender: currentUser?.gender ?? 'homme',
    cityOfResidence: currentUser?.city ?? 'Tunis',
    phone: currentUser?.phone ?? '+216',
  });

  if (!currentUser) {
    return null;
  }

  const request = state.verificationRequests.find((item) => item.userId === currentUser.id);

  const requestCode = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedCode(code);
    setFeedback(`Code de demo SMS: ${code}`);
  };

  const verifyCode = () => {
    if (generatedCode.length > 0 && enteredCode === generatedCode) {
      setPhoneVerified(true);
      setFeedback('Telephone verifie.');
      return;
    }
    setFeedback('Code incorrect.');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = submitVerification({
      ...form,
      gender: form.gender as 'femme' | 'homme' | 'autre',
      phoneVerified,
      documents: Object.entries(documents)
        .filter(([, name]) => Boolean(name))
        .map(([type, name]) => ({
          type: type as keyof typeof documents,
          name,
          uploadedAt: new Date().toISOString(),
        })),
    });

    setFeedback(result.message ?? '');
    setIsSubmitting(false);
    if (result.ok) {
      navigate('driver-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar
        title="Verification conducteur"
        subtitle="Permis, CIN, assurance et carte grise"
        onBack={() => navigate('driver-dashboard')}
      />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 rounded-[1.6rem] bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Statut actuel</p>
          <p className="mt-3 font-headline text-3xl font-extrabold text-slate-950">
            {currentUser.verificationStatus}
          </p>
          {request?.rejectionReason && (
            <p className="mt-3 text-sm text-slate-500">Motif rejet: {request.rejectionReason}</p>
          )}
        </div>

        {feedback && (
          <div className="mb-6 rounded-[1.5rem] bg-white p-4 text-sm font-semibold text-slate-700 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            {feedback}
          </div>
        )}

        <form className="space-y-6" onSubmit={submit}>
          <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h2 className="font-headline text-2xl font-extrabold text-slate-950">Identite</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Nom complet</span>
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  placeholder="Nom complet"
                  type="text"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Date de naissance</span>
                <input
                  value={form.dateOfBirth}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, dateOfBirth: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  type="date"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Genre</span>
                <select
                  value={form.gender}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, gender: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                >
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                  <option value="autre">Autre</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Ville de residence</span>
                <select
                  value={form.cityOfResidence}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, cityOfResidence: event.target.value }))
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
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h2 className="font-headline text-2xl font-extrabold text-slate-950">Telephone verifie</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Telephone</span>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  type="tel"
                />
              </label>
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={requestCode}
                  className="rounded-[1.4rem] bg-slate-100 px-4 py-4 text-sm font-bold text-slate-700"
                >
                  Envoyer code demo
                </button>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Code recu</span>
                <input
                  value={enteredCode}
                  onChange={(event) => setEnteredCode(event.target.value)}
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  placeholder="Code 6 chiffres"
                  type="text"
                />
              </label>
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={verifyCode}
                  className={`rounded-[1.4rem] px-4 py-4 text-sm font-bold ${
                    phoneVerified ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {phoneVerified ? 'Telephone verifie' : 'Confirmer'}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h2 className="font-headline text-2xl font-extrabold text-slate-950">Documents</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {Object.entries(DRIVER_DOCUMENT_LABELS).map(([type, label]) => (
                <label
                  key={type}
                  className="rounded-[1.4rem] bg-slate-100 px-4 py-4 text-sm font-semibold text-slate-700"
                >
                  {label}
                  <input
                    className="mt-3 block w-full text-sm"
                    type="file"
                    accept="image/*,.pdf"
                    capture="environment"
                    onChange={(event) =>
                      setDocuments((current) => ({
                        ...current,
                        [type]: event.target.files?.[0]?.name ?? '',
                      }))
                    }
                  />
                  {documents[type as keyof typeof documents] && (
                    <p className="mt-2 text-xs text-slate-500">
                      Fichier: {documents[type as keyof typeof documents]}
                    </p>
                  )}
                </label>
              ))}
            </div>
          </section>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[1.6rem] bg-[linear-gradient(135deg,_#0040a1_0%,_#006d36_160%)] py-5 font-headline text-xl font-extrabold text-white disabled:bg-slate-300"
          >
            {isSubmitting ? 'Envoi...' : 'Envoyer le dossier'}
          </button>
        </form>
      </main>
    </div>
  );
}
