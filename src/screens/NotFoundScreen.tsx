import TopAppBar from '../components/TopAppBar';
import { Screen } from '../types';

interface NotFoundScreenProps {
  navigate: (screen: Screen) => void;
}

export default function NotFoundScreen({ navigate }: NotFoundScreenProps) {
  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar title="Page introuvable" subtitle="Le parcours demande n'existe pas." />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">404</p>
          <h2 className="mt-4 font-headline text-4xl font-extrabold text-slate-950">
            Cette page n'est pas disponible.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            Revenez a l'accueil pour reprendre un parcours valide dans l'application.
          </p>
          <button
            type="button"
            onClick={() => navigate('welcome')}
            className="mt-8 rounded-full bg-[linear-gradient(135deg,_#0040a1_0%,_#006d36_160%)] px-5 py-3 text-sm font-bold text-white"
          >
            Retour a l'accueil
          </button>
        </section>
      </main>
    </div>
  );
}
