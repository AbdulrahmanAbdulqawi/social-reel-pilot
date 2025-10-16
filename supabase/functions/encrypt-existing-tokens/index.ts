import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { encrypt } from '../_shared/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the request is authorized
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Starting token encryption for user:', user.id);

    // Fetch all platform accounts for this user with plaintext tokens
    const { data: accounts, error: fetchError } = await supabase
      .from('platform_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) {
      throw fetchError;
    }

    if (!accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No accounts found to encrypt' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let encryptedCount = 0;
    const errors = [];

    // Process each account
    for (const account of accounts) {
      try {
        // Check if tokens appear to be already encrypted (base64 format with IV)
        const isAlreadyEncrypted = account.access_token?.includes('.');
        
        if (isAlreadyEncrypted) {
          console.log(`Account ${account.id} already encrypted, skipping`);
          continue;
        }

        // Encrypt tokens
        const encryptedAccessToken = account.access_token 
          ? await encrypt(account.access_token)
          : null;
        
        const encryptedRefreshToken = account.refresh_token
          ? await encrypt(account.refresh_token)
          : null;

        // Update the account with encrypted tokens
        const { error: updateError } = await supabase
          .from('platform_accounts')
          .update({
            access_token: encryptedAccessToken,
            refresh_token: encryptedRefreshToken,
          })
          .eq('id', account.id);

        if (updateError) {
          errors.push({ accountId: account.id, error: updateError.message });
          console.error(`Failed to update account ${account.id}:`, updateError);
        } else {
          encryptedCount++;
          console.log(`Successfully encrypted tokens for account ${account.id}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ accountId: account.id, error: errorMessage });
        console.error(`Error processing account ${account.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Encrypted ${encryptedCount} accounts`,
        totalAccounts: accounts.length,
        encryptedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Token encryption error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
