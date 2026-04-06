# BCM303 Pitch Platform — Setup

## What you need
- Supabase project: https://zupszzlhicabmkvmxrxe.supabase.co
- Supabase CLI installed: https://supabase.com/docs/guides/cli
- GitHub repo at psychosophonis.github.io (or a new one)

---

## Step 1 — Database

In Supabase dashboard → SQL Editor → paste and run `setup.sql`.

---

## Step 2 — Generate tutor password hash

Open `generate-tutor-hash.html` in a browser (no server needed, just double-click).
Enter your chosen tutor password. Copy the hash output.

---

## Step 3 — Set Supabase secrets

In Supabase dashboard → Edge Functions → Manage secrets, add:

  PASSWORD_SALT       bcm303dharawal2026
  TUTOR_PASSWORD_HASH <paste hash from step 2>

The salt must match exactly what was used in generate-tutor-hash.html.

---

## Step 4 — Deploy Edge Functions

Install Supabase CLI, then:

  supabase login
  supabase link --project-ref zupszzlhicabmkvmxrxe
  supabase functions deploy submit-pitch
  supabase functions deploy tutor-action

---

## Step 5 — Frontend

In Supabase dashboard → Settings → API, copy the `anon` public key.

Open `index.html`, find line:
  const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

Replace YOUR_ANON_KEY with the anon key.

Push index.html to your GitHub Pages repo root.

---

## Step 6 — Verify

Visit your GitHub Pages URL.
Submit a test pitch. Check it appears in the gallery.
Test tutor unlock with your password.

---

## Note on the synthesis flow

The Claude API call for synthesis happens client-side (from the tutor's browser).
The result is then saved to Supabase via the tutor-action Edge Function.
This means the Anthropic API key is NOT required server-side — it uses the
same API access as the Claude.ai interface. If deploying standalone outside
Claude.ai, you would need to move the synthesis call into an Edge Function
and add an Anthropic API key as a Supabase secret.
