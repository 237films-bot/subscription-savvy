import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Subscription {
  id: string;
  name: string;
  icon: string;
  renewal_day: number;
  renewal_month?: number;
  billing_cycle: string;
  user_id: string;
  alerts_enabled?: boolean;
}

interface UserWithEmail {
  id: string;
  email?: string;
}

/**
 * Days before renewal to send alerts
 * Alerts are sent at 11 days (early warning), 5 days (reminder), and 1 day (urgent)
 */
const ALERT_DAYS = [11, 5, 1];

function getDaysUntilRenewal(
  renewalDay: number,
  billingCycle: string = 'monthly',
  renewalMonth?: number
): number {
  const today = new Date();
  const renewalDate = getNextRenewalDate(renewalDay, billingCycle, renewalMonth);
  const diffTime = renewalDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getNextRenewalDate(
  renewalDay: number,
  billingCycle: string = 'monthly',
  renewalMonth?: number
): Date {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  if (billingCycle === 'annual' && renewalMonth) {
    const monthIndex = renewalMonth - 1;
    let renewalDate = new Date(currentYear, monthIndex, renewalDay);
    if (renewalDate <= today) {
      renewalDate = new Date(currentYear + 1, monthIndex, renewalDay);
    }
    return renewalDate;
  } else {
    if (renewalDay > currentDay) {
      return new Date(currentYear, currentMonth, renewalDay);
    }
    return new Date(currentYear, currentMonth + 1, renewalDay);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const userEmail = Deno.env.get("ALERT_EMAIL");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping alerts");
      return new Response(JSON.stringify({ message: "RESEND_API_KEY not configured" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!userEmail) {
      console.log("ALERT_EMAIL not configured, skipping alerts");
      return new Response(JSON.stringify({ message: "ALERT_EMAIL not configured" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resend = new Resend(resendApiKey);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    /**
     * Fetch all subscriptions where alerts are enabled
     * If alerts_enabled column doesn't exist yet, fetch all subscriptions as fallback
     */
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*, user:user_id(email)');

    if (error) {
      console.error("Error fetching subscriptions:", error);
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions found");
      return new Response(
        JSON.stringify({ message: "No subscriptions found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const alertsSent: string[] = [];
    const errors: string[] = [];

    for (const sub of subscriptions) {
      // Skip if alerts are explicitly disabled (if the column exists)
      if (sub.alerts_enabled === false) {
        console.log(`Alerts disabled for ${sub.name}, skipping`);
        continue;
      }

      // Get user email - try from joined user data or fall back to env variable
      const userEmail = (sub as any).user?.email || Deno.env.get("ALERT_EMAIL");

      if (!userEmail) {
        console.log(`No email found for subscription ${sub.name}, skipping`);
        errors.push(`No email for ${sub.name}`);
        continue;
      }
      const daysUntil = getDaysUntilRenewal(sub.renewal_day, sub.billing_cycle, sub.renewal_month);
      
      // Check if we should send an alert for this day
      if (ALERT_DAYS.includes(daysUntil)) {
        const renewalDate = getNextRenewalDate(sub.renewal_day, sub.billing_cycle, sub.renewal_month);
        const formattedDate = renewalDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        const urgencyText = daysUntil === 1 
          ? "⚠️ DEMAIN" 
          : daysUntil <= 5 
            ? `⚠️ Dans ${daysUntil} jours`
            : `Dans ${daysUntil} jours`;

        try {
          await resend.emails.send({
            from: "Mes Abonnements IA <onboarding@resend.dev>",
            to: [userEmail],
            subject: `${sub.icon} ${sub.name} - Renouvellement ${urgencyText}`,
            html: `
              <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <h1 style="font-size: 24px; margin-bottom: 16px;">
                  ${sub.icon} ${sub.name}
                </h1>
                <p style="font-size: 18px; color: ${daysUntil <= 5 ? '#dc2626' : '#ea580c'}; font-weight: bold;">
                  ${urgencyText}
                </p>
                <p style="font-size: 16px; color: #666;">
                  Votre abonnement ${sub.name} sera renouvelé le <strong>${formattedDate}</strong>.
                </p>
                <p style="font-size: 14px; color: #888; margin-top: 24px;">
                  — Mes Abonnements IA
                </p>
              </div>
            `,
          });

          alertsSent.push(`${sub.name} (J-${daysUntil})`);
          console.log(`Alert sent for ${sub.name}, ${daysUntil} days until renewal`);
        } catch (emailError) {
          console.error(`Failed to send email for ${sub.name}:`, emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Alerts processed",
        alertsSent,
        errors: errors.length > 0 ? errors : undefined,
        totalSubscriptions: subscriptions.length,
        alertsEnabled: subscriptions.filter(s => s.alerts_enabled !== false).length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-renewal-alerts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
