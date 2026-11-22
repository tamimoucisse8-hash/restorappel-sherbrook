"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error("Courriel ou mot de passe incorrect. Veuillez réessayer.");
        setLoading(false);
        return;
      }

      toast.success("Connexion réussie. Bienvenue !");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Une erreur inattendue est survenue lors de la connexion.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-zinc-50 px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <Link href="/" className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-900 text-white">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <span className="text-base font-bold text-zinc-950">
            RestoRappel Sherbrooke
          </span>
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          Connexion restaurateur
        </h1>
        <p className="mt-1.5 text-sm text-zinc-600">
          Accédez à vos réservations du jour et à votre calendrier.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-800"
            >
              Adresse courriel
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="proprio@monresto.ca"
              className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 px-3.5 text-sm text-zinc-950 outline-none transition focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-800"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 px-3.5 text-sm text-zinc-950 outline-none transition focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-brand-900 px-4 text-sm font-bold text-white transition hover:bg-brand-800 disabled:opacity-60"
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Pas encore de compte ?{" "}
          <Link
            href="/inscription"
            className="font-semibold text-brand-900 hover:underline"
          >
            Essai gratuit 14 jours
          </Link>
        </p>
      </div>
    </div>
  );
}
