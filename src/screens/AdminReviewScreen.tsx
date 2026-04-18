import { useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import { DRIVER_DOCUMENT_LABELS } from '../constants';
import { useVolta } from '../context/VoltaContext';
import { Screen } from '../types';

interface AdminReviewScreenProps {
  navigate: (screen: Screen) => void;
}

export default function AdminReviewScreen({ navigate }: AdminReviewScreenProps) {
  const { state, reviewDriverRequest } = useVolta();
  const [feedback, setFeedback] = useState('');
  const pendingRequests = state.verificationRequests.filter((request) => request.status === 'pending');

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar title="Back-office" subtitle="Validation documents conducteurs" />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        {feedback && (
          <div className="rounded-[1.5rem] bg-white p-4 text-sm font-semibold text-slate-700 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            {feedback}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,_#0f172a_0%,_#1e293b_100%)] p-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.26)]">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">Admin workflow</p>
            <h2 className="mt-4 font-headline text-4xl font-extrabold tracking-tight">
              Dossiers en attente: {pendingRequests.length}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/75">
              Validation des permis, CIN, assurance et carte grise avant activation chauffeur.
            </p>
            <button
              type="button"
              onClick={() => navigate('explore')}
              className="mt-6 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900"
            >
              Retour accueil
            </button>
          </div>

          <div className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => {
                const user = state.users.find((candidate) => candidate.id === request.userId);

                return (
                  <article
                    key={request.id}
                    className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
                  >
                    <h3 className="font-headline text-2xl font-extrabold text-slate-950">
                      {user?.fullName ?? 'Conducteur'}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {user?.email} - {request.cityOfResidence}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {request.documents.map((document) => (
                        <div key={document.type} className="rounded-[1.4rem] bg-slate-50 p-3">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                            {DRIVER_DOCUMENT_LABELS[document.type]}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-700">{document.name}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const result = reviewDriverRequest(request.id, 'approved');
                          setFeedback(result.message ?? '');
                        }}
                        className="rounded-full bg-secondary px-5 py-3 text-sm font-bold text-white"
                      >
                        Approuver
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFeedback(
                            reviewDriverRequest(
                              request.id,
                              'rejected',
                              'Documents incomplets ou illisibles',
                            ).message ?? '',
                          )
                        }
                        className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700"
                      >
                        Rejeter
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[2rem] bg-white p-6 text-sm text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                Aucun dossier en attente.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
