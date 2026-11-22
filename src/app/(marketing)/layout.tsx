import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-950">
      {/* Barre de navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-900 text-white">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <span className="block text-base font-bold tracking-tight text-zinc-950">
                RestoRappel
              </span>
              <span className="block text-[11px] font-medium text-brand-800">
                Sherbrooke
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
            <a href="#comment-ca-marche" className="transition hover:text-zinc-950">
              Comment ça marche
            </a>
            <a href="#prix" className="transition hover:text-zinc-950">
              Prix
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/connexion"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Essai gratuit 14 jours
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1">{children}</main>

      {/* Pied de page */}
      <footer className="border-t border-zinc-200 bg-zinc-50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-zinc-600 sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} RestoRappel Sherbrooke — Conçu pour les restaurants indépendants d&apos;ici.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/connexion" className="hover:text-zinc-950">
              Espace restaurateur
            </Link>
            <Link href="/inscription" className="hover:text-zinc-950">
              Démarrer l&apos;essai
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
