import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashPassword(password: string): Promise<string> {
  const salt = Deno.env.get("PASSWORD_SALT") ?? "bcm303dharawal2026";
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { tutorPassword, action, content, groupName } = body;

    if (!tutorPassword) {
      return new Response(JSON.stringify({ error: "Tutor password required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate tutor password against stored hash
    const submittedHash = await hashPassword(tutorPassword);
    const storedHash = Deno.env.get("TUTOR_PASSWORD_HASH");

    if (!storedHash || submittedHash !== storedHash) {
      return new Response(JSON.stringify({ error: "Invalid tutor password" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // update-metapitch: write synthesized show vision to db
    if (action === "update-metapitch") {
      const { error } = await supabase
        .from("metapitch")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", 1);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // delete-pitch: remove a group's submission (moderation)
    if (action === "delete-pitch") {
      if (!groupName) {
        return new Response(JSON.stringify({ error: "groupName required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("pitches")
        .delete()
        .eq("group_name", groupName);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
