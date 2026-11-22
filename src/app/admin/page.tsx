import { redirect } from "next/navigation";
import { Building2, DollarSign, ShieldCheck, Store } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type DisplayStatus = "Essai" | "Payant" | "Bloqué";

function computeDisplayStatus(
  status: string | undefined,
  currentPeriodEnd: string | undefined
): DisplayStatus {
  if (status === "active") return "Payant";
  if (status === "trial") {
    const expired =
      currentPeriodEnd && new Date(currentPeriodEnd).getTime() < Date.now();
    return expired ? "Bloqué" : "Essai";
  }
  return "Bloqué";
}

function getMonthlyCad(plan: string | undefined, status: string | undefined): number {
  if (status !== "active") return 0;
  if (plan === "launch_19") return 19;
  if (plan === "standard_29") return 29;
  return 0;
}

export default async function AdminPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const adminSupabase = createAdminSupabaseClient();

  const [{ data: restaurants }, { data: subscriptions }] = await Promise.all([
    adminSupabase
      .from("restaurants")
      .select("id, name, slug, address, phone, cuisine_type, created_at")
      .order("created_at", { ascending: false }),
    adminSupabase
      .from("subscriptions")
      .select("restaurant_id, plan, status, current_period_end"),
  ]);

  const subByRestoId = new Map(
    (subscriptions ?? []).map((s) => [s.restaurant_id, s])
  );

  const rows = (restaurants ?? []).map((resto) => {
    const sub = subByRestoId.get(resto.id);
    const displayStatus = computeDisplayStatus(
      sub?.status,
      sub?.current_period_end
    );
    const monthlyCad = getMonthlyCad(sub?.plan, sub?.status);

    return {
      ...resto,
      plan: sub?.plan ?? "trial",
      displayStatus,
      monthlyCad,
    };
  });

  const totalRestaurants = rows.length;
  const payingRestaurants = rows.filter(
    (r) => r.displayStatus === "Payant"
  ).length;
  const totalMonthlyCad = rows.reduce((sum, r) => sum + r.monthlyCad, 0);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-900">
                Administration RestoRappel
              </p>
              <h1 className="text-xl font-extrabold text-zinc-950">
                Vue globale — Sherbrooke
              </h1>
            </div>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            Revenus retirés via Wise
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* KPIs Admin */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-zinc-600">
              <span className="text-sm font-medium">
                Restos inscrits au total
              </span>
              <Store className="h-4 w-4 text-zinc-900" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-zinc-950">
              {totalRestaurants}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-zinc-600">
              <span className="text-sm font-medium">Restos qui paient</span>
              <Building2 className="h-4 w-4 text-brand-900" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-brand-900">
              {payingRestaurants}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-zinc-600">
              <span className="text-sm font-medium">
                Revenu mensuel total (CAD)
              </span>
              <DollarSign className="h-4 w-4 text-brand-900" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-zinc-950">
              {totalMonthlyCad} $ CAD
            </p>
          </div>
        </div>

        {/* Liste de tous les restos */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-base font-bold text-zinc-950">
              Tous les restaurants ({totalRestaurants})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                <tr>
                  <th className="px-6 py-3.5">Restaurant</th>
                  <th className="px-6 py-3.5">Cuisine</th>
                  <th className="px-6 py-3.5">Téléphone</th>
                  <th className="px-6 py-3.5">Statut</th>
                  <th className="px-6 py-3.5 text-right">Revenu / mois</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-zinc-500"
                    >
                      Aucun restaurant inscrit pour le moment.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50/70">
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-950">{r.name}</p>
                        <p className="text-xs text-zinc-500">/r/{r.slug}</p>
                      </td>
                      <td className="px-6 py-4 text-zinc-700">
                        {r.cuisine_type}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-700">
                        {r.phone}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                            r.displayStatus === "Payant"
                              ? "border-brand-200 bg-brand-50 text-brand-900"
                              : r.displayStatus === "Essai"
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {r.displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-zinc-950">
                        {r.monthlyCad} $ CAD
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
