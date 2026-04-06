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
    const { groupName, password, stocktake, showVision, segmentAnchor, designPosition } =
      await req.json();

    if (!groupName?.trim() || !password?.trim()) {
      return new Response(
        JSON.stringify({ error: "Group name and password required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const passwordHash = await hashPassword(password);

    // Check if group already exists
    const { data: existing } = await supabase
      .from("pitches")
      .select("password_hash")
      .eq("group_name", groupName.trim())
      .maybeSingle();

    if (existing) {
      // Verify password before allowing update
      if (existing.password_hash !== passwordHash) {
        return new Response(
          JSON.stringify({ error: "Wrong password for this group name" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("pitches")
        .update({
          stocktake,
          show_vision: showVision,
          segment_anchor: segmentAnchor,
          design_position: designPosition,
          updated_at: new Date().toISOString(),
        })
        .eq("group_name", groupName.trim());

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, action: "updated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // New submission
      const { error } = await supabase.from("pitches").insert({
        group_name: groupName.trim(),
        password_hash: passwordHash,
        stocktake,
        show_vision: showVision,
        segment_anchor: segmentAnchor,
        design_position: designPosition,
      });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, action: "created" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
