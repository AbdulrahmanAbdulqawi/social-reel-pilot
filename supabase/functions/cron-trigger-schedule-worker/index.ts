import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('DISABLED: Schedule worker cron trigger is disabled - GetLate now handles all scheduling');
  
  // Return success but don't actually trigger the worker
  // GetLate handles all scheduling now
  return new Response(JSON.stringify({ 
    success: true,
    message: 'Schedule worker disabled - GetLate handles all scheduling',
    note: 'This cron job is kept for backwards compatibility but does nothing'
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
