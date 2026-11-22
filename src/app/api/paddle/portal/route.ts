import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createPaddleCustomerPortalSession } from "@/lib/paddle";

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const body = await request.json();
    const paddleCustomerId: string | undefined = body?.paddleCustomerId;
    const subscriptionId: string | undefined = body?.subscriptionId;

    if (!paddleCustomerId) {
      return NextResponse.json(
        { error: "Identifiant client Paddle manquant." },
        { status: 400 }
      );
    }

    const url = await createPaddleCustomerPortalSession(
      paddleCustomerId,
      subscriptionId ? [subscriptionId] : []
    );

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Erreur POST /api/paddle/portal:", err);
    return NextResponse.json(
      { error: "Impossible d'ouvrir le portail client Paddle." },
      { status: 500 }
    );
  }
}
