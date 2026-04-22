import { FormEvent, useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import { useVolta } from '../context/VoltaContext';
import { Screen } from '../types';

interface CreateTripScreenProps {
  navigate: (screen: Screen) => void;
}

export default function CreateTripScreen({ navigate }: CreateTripScreenProps) {
  const { createDriverRide, currentUser } = useVolta();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    departureCity: 'Tunis',
    destinationCity: 'Sousse',
    departureAt: '2026-04-19T08:30',
    availableSeats: 4,
    priceTnd: 18,
    vehicleModel: 'Toyota Hiace',
    plateNumber: '',
    vehiclePhotoName: '',
    vehiclePhoto: null as File | null,
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = await createDriverRide({
      ...form,
      departureAt: new Date(form.departureAt).toISOString(),
    });

    if (!result.ok) {
      setFeedback(result.message ?? '');
      setIsSubmitting(false);
      return;
    }

    setFeedback(result.message ?? '');
    setIsSubmitting(false);
    navigate('driver-dashboard');
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar
        title="Publier un trajet"
        subtitle="Annonce louage conducteur"
        onBack={() => navigate('driver-dashboard')}
      />

      <main className="mx-auto max-w-3xl px-6 py-8">
        {currentUser?.verificationStatus !== 'approved' && (
          <div className="mb-6 rounded-[1.5rem] bg-white p-4 text-sm font-semibold text-slate-700 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            Publication bloquee tant que le dossier conducteur n'est pas approuve.
          </div>
        )}

        {feedback && (
          <div className="mb-6 rounded-[1.5rem] bg-white p-4 text-sm font-semibold text-slate-700 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            {feedback}
          </div>
        )}

        <form className="space-y-6" onSubmit={submit}>
          <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h2 className="font-headline text-2xl font-extrabold text-slate-950">Trajet</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Ville depart</span>
                <input
                  value={form.departureCity}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, departureCity: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  placeholder="Ville depart"
                  type="text"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Ville destination</span>
                <input
                  value={form.destinationCity}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, destinationCity: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  placeholder="Ville destination"
                  type="text"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Depart</span>
                <input
                  value={form.departureAt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, departureAt: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  type="datetime-local"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Places disponibles</span>
                <input
                  value={form.availableSeats}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      availableSeats: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  min={1}
                  max={8}
                  type="number"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h2 className="font-headline text-2xl font-extrabold text-slate-950">Vehicule</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Prix</span>
                <input
                  value={form.priceTnd}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, priceTnd: Number(event.target.value) }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  min={1}
                  step={0.5}
                  type="number"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Modele vehicule</span>
                <input
                  value={form.vehicleModel}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, vehicleModel: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  placeholder="Modele vehicule"
                  type="text"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Plaque</span>
                <input
                  value={form.plateNumber}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, plateNumber: event.target.value }))
                  }
                  className="w-full rounded-[1.4rem] bg-slate-100 px-4 py-4 text-slate-900 outline-none"
                  placeholder="Plaque"
                  type="text"
                />
              </label>
              <label className="rounded-[1.4rem] bg-slate-100 px-4 py-4 text-sm font-semibold text-slate-600">
                Photo optionnelle
                <input
                  className="mt-3 block w-full text-sm"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      vehiclePhotoName: event.target.files?.[0]?.name ?? '',
                      vehiclePhoto: event.target.files?.[0] ?? null,
                    }))
                  }
                />
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={currentUser?.verificationStatus !== 'approved' || isSubmitting}
            className="w-full rounded-[1.6rem] bg-[linear-gradient(135deg,_#0040a1_0%,_#006d36_160%)] py-5 font-headline text-xl font-extrabold text-white disabled:bg-slate-300"
          >
            {isSubmitting ? 'Publication...' : "Publier l'annonce"}
          </button>
        </form>
      </main>
    </div>
  );
}
