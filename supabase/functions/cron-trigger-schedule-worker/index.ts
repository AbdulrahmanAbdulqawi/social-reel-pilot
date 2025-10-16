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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Triggering schedule worker...');

    // Call the schedule-worker function with proper authentication
    const { data, error } = await supabase.functions.invoke('schedule-worker', {
      headers: {
        Authorization: `Bearer ${scheduleWorkerSecret}`,
      },
      body: { 
        time: new Date().toISOString(),
        source: 'cron-trigger'
      },
    });

    if (error) {
      console.error('Error invoking schedule-worker:', error);
      throw error;
    }

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
