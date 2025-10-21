import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const scheduleWorkerSecret = Deno.env.get('SCHEDULE_WORKER_SECRET');
    
    if (!scheduleWorkerSecret) {
      throw new Error('SCHEDULE_WORKER_SECRET not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    console.log('Triggering schedule worker...');

    // Call the schedule-worker function with proper authentication using fetch
    const response = await fetch(`${supabaseUrl}/functions/v1/schedule-worker`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${scheduleWorkerSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        time: new Date().toISOString(),
        source: 'cron-trigger'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error invoking schedule-worker:', errorText);
      throw new Error(`Schedule worker returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Schedule worker completed:', data);

    return new Response(
      JSON.stringify({ success: true, result: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cron trigger error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
