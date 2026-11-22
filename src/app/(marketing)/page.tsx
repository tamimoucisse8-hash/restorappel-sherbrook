import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="bg-white text-zinc-950">
      {/* SECTION HÉRO */}
      <section className="mx-auto max-w-5xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24 sm:pb-28">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-900/15 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-900">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Pensé pour les restos de Sherbrooke</span>
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl">
          Fini les tables vides à cause des{" "}
          <span className="text-brand-900">no-show</span>.
        </h1>

        {/* Explication exacte en 3 phrases */}
        <div className="mx-auto mt-7 max-w-3xl space-y-2 text-lg leading-relaxed text-zinc-600 sm:text-xl">
          <p>Réduisez vos no-show grâce aux rappels SMS automatiques.</p>
          <p>Recevez des réservations en ligne en 30 secondes.</p>
          <p>Seulement 29 $ CAD par mois, sans commission.</p>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/inscription"
            className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-brand-900 px-8 text-base font-bold text-white shadow-sm transition hover:bg-brand-800 sm:w-auto"
          >
            <span>Essai gratuit 14 jours</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <p className="mt-4 text-sm font-medium text-zinc-500">
          14 jours gratuits, sans carte bancaire. Annulation en un clic.
        </p>

        {/* Types de restos de Sherbrooke */}
        <div className="mt-14 border-t border-zinc-100 pt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Idéal pour les indépendants d&apos;ici
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-sm text-zinc-700">
            {[
              "Pizzerias",
              "Casse-croûtes",
              "Cafés",
              "Restos familiaux",
              "Cuisine haïtienne",
              "Cuisine africaine",
              "Cuisine asiatique",
            ].map((type) => (
              <span
                key={type}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-medium"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION COMMENT ÇA MARCHE (3 ÉTAPES) */}
      <section
        id="comment-ca-marche"
        className="border-y border-zinc-200 bg-zinc-50/70 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              Comment ça marche
            </h2>
            <p className="mt-3 text-base text-zinc-600 sm:text-lg">
              Simple comme bonjour pour vous et vos clients, sans équipement compliqué.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {/* Étape 1 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-900 text-sm font-bold text-white">
                1
              </div>
              <div className="mt-5 flex items-center gap-2 text-zinc-950">
                <CalendarCheck className="h-5 w-5 text-brand-900" />
                <h3 className="text-lg font-bold">Partagez votre lien de réservation</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Configurez vos horaires et vos tables en quelques minutes. Vos clients réservent en 30 secondes depuis leur téléphone, sans créer de compte.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-900 text-sm font-bold text-white">
                2
              </div>
              <div className="mt-5 flex items-center gap-2 text-zinc-950">
                <MessageSquareText className="h-5 w-5 text-brand-900" />
                <h3 className="text-lg font-bold">Rappel SMS automatique 3h avant</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Dès la réservation puis 3 heures avant l&apos;heure prévue, un SMS part automatiquement. Le client répond simplement{" "}
                <strong className="text-zinc-900">OUI</strong> ou{" "}
                <strong className="text-zinc-900">NON</strong>.
              </p>
            </div>

            {/* Étape 3 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-900 text-sm font-bold text-white">
                3
              </div>
              <div className="mt-5 flex items-center gap-2 text-zinc-950">
                <ShieldCheck className="h-5 w-5 text-brand-900" />
                <h3 className="text-lg font-bold">Votre tableau de bord se met à jour seul</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Les réponses sont traitées en temps réel. Si un client annule par SMS, sa table est libérée et affichée comme annulée sans que vous ayez à courir après personne.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION PRIX */}
      <section id="prix" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              Prix clair, zéro commission par couvert
            </h2>
            <p className="mt-3 text-base text-zinc-600 sm:text-lg">
              Commencez avec 14 jours d&apos;essai gratuit sans carte bancaire.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Offre Lancement */}
            <div className="flex flex-col justify-between rounded-2xl border-2 border-brand-900 bg-brand-50/40 p-8">
              <div>
                <div className="inline-flex rounded-full bg-brand-900 px-3 py-1 text-xs font-semibold text-white">
                  Offre Lancement — 20 premiers restos
                </div>
                <h3 className="mt-4 text-xl font-bold text-zinc-950">
                  Tarif Fondateur Sherbrooke
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-zinc-950">19 $</span>
                  <span className="text-base font-semibold text-zinc-600">
                    CAD / mois
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  Réservé aux 20 premiers restaurants actifs après l&apos;essai de 14 jours.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-zinc-800">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-900" />
                    <span>14 jours d&apos;essai gratuit sans carte</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-900" />
                    <span>Page de réservation en ligne personnalisée</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-900" />
                    <span>SMS de confirmation + rappel 3h avant (OUI/NON)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-900" />
                    <span>0 $ de commission sur vos réservations</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/inscription"
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-900 px-5 text-sm font-bold text-white transition hover:bg-brand-800"
              >
                Essai gratuit 14 jours
              </Link>
            </div>

            {/* Offre Normale */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
              <div>
                <div className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                  Offre Normale
                </div>
                <h3 className="mt-4 text-xl font-bold text-zinc-950">
                  Forfait Resto Complet
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-zinc-950">29 $</span>
                  <span className="text-base font-semibold text-zinc-600">
                    CAD / mois
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  Tout inclus pour gérer vos tables et réduire les absences au quotidien.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-zinc-800">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-900" />
                    <span>14 jours d&apos;essai gratuit sans carte</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-900" />
                    <span>Tableau de bord du jour + calendrier hebdomadaire</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-900" />
                    <span>SMS de confirmation + rappel 3h avant (OUI/NON)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-brand-900" />
                    <span>0 $ de commission sur vos réservations</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/inscription"
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl border border-zinc-950 bg-white px-5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-50"
              >
                Essai gratuit 14 jours
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
