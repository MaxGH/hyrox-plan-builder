import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. Auth: validate JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = claimsData.claims.sub as string;

  try {
    const body = await req.json();

    // 2. Rate limit check
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existing, error: fetchError } = await serviceClient
      .from("training_plans")
      .select("status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    if (existing && existing.length > 0) {
      const row = existing[0];

      if (row.status === "pending") {
        return new Response(
          JSON.stringify({ error: "Plan wird bereits erstellt" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (row.status === "ready" && row.created_at) {
        const createdAt = new Date(row.created_at).getTime();
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (createdAt > twentyFourHoursAgo) {
          return new Response(
            JSON.stringify({ error: "Du kannst nur 1 Plan pro 24h erstellen" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 3. Insert pending row
    const { error: insertError } = await serviceClient
      .from("training_plans")
      .insert({
        user_id: userId,
        status: "pending",
        onboarding_data: body.onboarding,
      });

    if (insertError) throw insertError;

    // 4. Forward to n8n (fire and forget)
    const webhookUrl =
      "https://n8n.srv1371680.hstgr.cloud/webhook/38e417df-407a-4917-9627-4237643284a1";
    const webhookSecret = Deno.env.get("N8N_WEBHOOK_SECRET");

    console.log("Calling n8n webhook:", webhookUrl);
    console.log("Webhook secret present:", !!webhookSecret, "value length:", webhookSecret?.length);
    
    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhookSecret ? { "x-app-secret": webhookSecret } : {}),
      },
      body: JSON.stringify({ onboarding: { ...body.onboarding, user_id: userId } }),
    })
      .then((res) => console.log("n8n webhook response:", res.status, res.statusText))
      .catch((err) => console.error("n8n webhook error:", err.message));

    // 5. Return success
    return new Response(
      JSON.stringify({ success: true, status: "pending" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : JSON.stringify(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
