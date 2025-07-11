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

  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')
  
  // Initialize Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { global: { headers: { Authorization: token } } }
  )

  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  const { recipient_email, amount } = await req.json()
  
  // Validate inputs
  if (typeof amount !== 'number' || amount <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
  
  if (typeof recipient_email !== 'string' || !recipient_email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Invalid recipient email' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  try {
    // Call the process_transfer function with the authenticated user's ID
    const { data, error } = await supabase.rpc('process_transfer', {
      current_user_id: user.id,
      recipient_email,
      amount,
    })

    if (error) throw error
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
