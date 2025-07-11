import { serve } from "https://deno.land/std@0.202.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.17.0"

/*
  ⚠️ This function is intentionally vulnerable to demonstrate OWASP A01 and A04:
  - Broken Access Control: It trusts the client-provided `from_user_id` without verifying it belongs to the authenticated user.
  - Business Logic Flaw: It allows transfers even if the sender doesn't have enough balance.
*/

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { from_user_id, recipient_email, amount } = await req.json()

  // Initialize Supabase with service role (bypasses RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    // Minimal validation
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid amount')
    }

    // Call the vulnerable function: process_transfer
    const { data, error } = await supabase.rpc('process_transfer', {
      from_user_id,
      recipient_email,
      amount,
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
