"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function InscriptionPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        toast.error(
          error.message.includes("already")
            ? "Cette adresse courriel est déjà utilisée."
            : "Impossible de créer le compte. Vérifiez vos informations."
        );
        setLoading(false);
        return;
      }

      if (!data.session) {
        toast.success(
          "Compte créé ! Vérifiez votre boîte courriel pour confirmer votre inscription, puis connectez-vous."
        );
        router.push("/connexion");
        return;
      }

      toast.success("Compte créé ! Configurons maintenant votre restaurant.");
      router.push("/dashboard/onboarding");
      router.refresh();
    } catch {
      toast.error("Une erreur réseau est survenue lors de l'inscription.");
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
          Démarrer votre essai de 14 jours
        </h1>
        <p className="mt-1.5 text-sm text-zinc-600">
          Gratuit pendant 14 jours, sans carte bancaire. Créez votre compte en 30 secondes.
        </p>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-zinc-800"
            >
              Votre nom complet
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Marc-Antoine Gagnon"
              className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 px-3.5 text-sm text-zinc-950 outline-none transition focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-800"
            >
              Courriel professionnel
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 px-3.5 text-sm text-zinc-950 outline-none transition focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-brand-900 px-4 text-sm font-bold text-white transition hover:bg-brand-800 disabled:opacity-60"
          >
            {loading ? "Création du compte..." : "Continuer vers la configuration"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Vous avez déjà un compte ?{" "}
          <Link
            href="/connexion"
            className="font-semibold text-brand-900 hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
