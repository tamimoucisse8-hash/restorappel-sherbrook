import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import SubscriptionManager from "@/components/dashboard/SubscriptionManager";
import type { Restaurant, Subscription } from "@/types/database";

export default async function AbonnementPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!restaurant) {
    redirect("/dashboard/onboarding");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  if (!subscription) {
    redirect("/dashboard");
  }

  // Compter combien de restaurants ont déjà un abonnement actif pour l'offre lancement (20 max)
  const adminClient = createAdminSupabaseClient();
  const { count } = await adminClient
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const activeCount = count ?? 0;
  const launchSpotsRemaining = Math.max(0, 20 - activeCount);

  return (
    <div className="min-h-screen bg-zinc-50">
      <SubscriptionManager
        restaurant={restaurant as Restaurant}
        subscription={subscription as Subscription}
        userEmail={user.email ?? ""}
        launchSpotsRemaining={launchSpotsRemaining}
      />
    </div>
  );
}
