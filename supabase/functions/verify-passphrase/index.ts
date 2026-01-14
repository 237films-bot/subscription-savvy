import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting store (resets on function cold start)
// For production, consider using Supabase table or Redis
const rateLimitStore = new Map<string, { attempts: number; blockedUntil: number }>();

const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; blockedFor?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) {
    return { allowed: true, remainingAttempts: RATE_LIMIT_ATTEMPTS };
  }

  // Check if still blocked
  if (record.blockedUntil > now) {
    const blockedFor = Math.ceil((record.blockedUntil - now) / 1000 / 60);
    return { allowed: false, remainingAttempts: 0, blockedFor };
  }

  // Reset if block expired
  if (record.blockedUntil <= now && record.attempts >= RATE_LIMIT_ATTEMPTS) {
    rateLimitStore.delete(ip);
    return { allowed: true, remainingAttempts: RATE_LIMIT_ATTEMPTS };
  }

  return { allowed: true, remainingAttempts: RATE_LIMIT_ATTEMPTS - record.attempts };
}

function recordAttempt(ip: string, success: boolean): void {
  const now = Date.now();
  
  if (success) {
    // Reset on successful login
    rateLimitStore.delete(ip);
    return;
  }

  const record = rateLimitStore.get(ip) || { attempts: 0, blockedUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= RATE_LIMIT_ATTEMPTS) {
    record.blockedUntil = now + RATE_LIMIT_WINDOW_MS;
    console.log(`IP ${ip} blocked until ${new Date(record.blockedUntil).toISOString()}`);
  }

  rateLimitStore.set(ip, record);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('cf-connecting-ip') || 
               'unknown';

    console.log(`Passphrase verification attempt from IP: ${ip}`);

    // Check rate limit
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      console.log(`Rate limited IP: ${ip}, blocked for ${rateCheck.blockedFor} minutes`);
      return new Response(
        JSON.stringify({ 
          error: `Trop de tentatives. Réessayez dans ${rateCheck.blockedFor} minute(s).`,
          blocked: true,
          blockedFor: rateCheck.blockedFor
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { passphrase } = await req.json();

    if (!passphrase || typeof passphrase !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Passphrase requise' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const storedPassphrase = Deno.env.get('APP_PASSPHRASE');
    
    if (!storedPassphrase) {
      console.error('APP_PASSPHRASE not configured');
      return new Response(
        JSON.stringify({ error: 'Configuration serveur incorrecte' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Constant-time comparison to prevent timing attacks
    const isValid = passphrase.length === storedPassphrase.length && 
                    passphrase.split('').every((char, i) => char === storedPassphrase[i]);

    // Record attempt for rate limiting
    recordAttempt(ip, isValid);

    if (!isValid) {
      const remaining = rateCheck.remainingAttempts - 1;
      console.log(`Invalid passphrase attempt from IP: ${ip}, ${remaining} attempts remaining`);
      
      return new Response(
        JSON.stringify({ 
          error: 'Passphrase incorrecte',
          remainingAttempts: remaining
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Successful passphrase verification from IP: ${ip}`);

    // Generate a simple session token (in production, use proper JWT)
    const sessionToken = crypto.randomUUID();
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

    return new Response(
      JSON.stringify({ 
        success: true,
        sessionToken,
        expiresAt
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in verify-passphrase:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
