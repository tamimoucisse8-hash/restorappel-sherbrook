import { createClient } from "@supabase/supabase-js";

/**
 * Client administratif contournant RLS.
 * À utiliser UNIQUEMENT côté serveur dans les webhooks (Paddle, Twilio)
 * et les tâches planifiées (Cron) après vérification d'authenticité.
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY est manquant."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
