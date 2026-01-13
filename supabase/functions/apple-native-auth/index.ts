// supabase/functions/apple-native-auth/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

serve(async (req) => {
  try {
    const { sub, email } = await req.json();

    if (!sub || !email) {
      return new Response(
        JSON.stringify({ error: "Missing sub or email" }),
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existing, error: listErr } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
        email
      });

    const exists = existing?.users?.[0] ?? null;

    if (!exists) {
      const { error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          app_metadata: {
            provider: "apple",
            apple_sub: sub,
          },
        });

      if (createErr) throw createErr;
    }

    const { data: linkData, error: linkErr } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkErr) throw linkErr;

    const { access_token, refresh_token, user } = linkData;

    return new Response(
      JSON.stringify({ access_token, refresh_token, user }),
      { status: 200 }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});
