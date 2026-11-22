import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import OnboardingWizard from "@/components/dashboard/OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  // Si le restaurant existe déjà, rediriger directement vers le tableau de bord
  const { data: existingRestaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingRestaurant) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <OnboardingWizard userId={user.id} />
    </div>
  );
}
