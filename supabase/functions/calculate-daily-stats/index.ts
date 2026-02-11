// Supabase Edge Function: calculate-daily-stats
// Calculates and stores daily statistics for analytics
// Can be triggered via HTTP or scheduled via cron
// Usage: POST /calculate-daily-stats?backfill_days=30

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface DailyStats {
  user_id: string;
  office_id: string | null;
  stat_date: string;
  total_activities: number;
  phone_calls: number;
  showings: number;
  appointments: number;
  new_properties: number;
  new_customers: number;
  sales_closed: number;
  rentals_closed: number;
  deposits_taken: number;
  total_commission: number;
  total_revenue: number;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Parse backfill_days from query params (default: 1 for yesterday)
    const url = new URL(req.url);
    const backfillDays = parseInt(url.searchParams.get("backfill_days") || "1", 10);

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date();
    const results: { date: string; users: number; success: boolean }[] = [];

    // Process each day
    for (let i = 1; i <= backfillDays; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      const dateStr = targetDate.toISOString().split("T")[0];

      console.log(`Processing stats for ${dateStr}...`);

      // Get all unique users who had activity on this date
      const { data: activeUsers, error: usersError } = await supabase
        .from("profiles")
        .select("id, office_id");

      if (usersError) {
        console.error("Error fetching users:", usersError);
        continue;
      }

      let usersProcessed = 0;

      for (const user of activeUsers || []) {
        const stats = await calculateUserDailyStats(
          supabase,
          user.id,
          user.office_id,
          dateStr
        );

        if (stats) {
          // Upsert daily stats
          const { error: upsertError } = await supabase
            .from("daily_stats")
            .upsert(stats, {
              onConflict: "user_id,stat_date",
            });

          if (upsertError) {
            console.error(`Error upserting stats for user ${user.id}:`, upsertError);
          } else {
            usersProcessed++;
          }
        }
      }

      results.push({ date: dateStr, users: usersProcessed, success: true });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${backfillDays} day(s) of statistics`,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function calculateUserDailyStats(
  supabase: any,
  userId: string,
  officeId: string | null,
  dateStr: string
): Promise<DailyStats | null> {
  try {
    // Fetch activities for the user on this date
    const { data: activities, error: activitiesError } = await supabase
      .from("activities")
      .select("type, status")
      .eq("user_id", userId)
      .eq("date", dateStr);

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError);
    }

    // Count activities by type
    const activityCounts = {
      total: activities?.length || 0,
      phone_calls: 0,
      showings: 0,
      appointments: 0,
    };

    for (const activity of activities || []) {
      if (activity.type === "Gelen Arama" || activity.type === "Giden Arama") {
        activityCounts.phone_calls++;
      } else if (activity.type === "Yer Gösterimi") {
        activityCounts.showings++;
      } else if (activity.type === "Ofis Toplantısı") {
        activityCounts.appointments++;
      }
    }

    // Fetch new properties created on this date
    const { count: newProperties } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", `${dateStr}T00:00:00`)
      .lt("created_at", `${dateStr}T23:59:59`);

    // Fetch new customers created on this date
    const { count: newCustomers } = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", `${dateStr}T00:00:00`)
      .lt("created_at", `${dateStr}T23:59:59`);

    // Fetch sales on this date
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("transaction_type, commission_amount, sale_price")
      .eq("user_id", userId)
      .eq("sale_date", dateStr);

    if (salesError) {
      console.error("Error fetching sales:", salesError);
    }

    let salesClosed = 0;
    let rentalsClosed = 0;
    let totalCommission = 0;
    let totalRevenue = 0;

    for (const sale of sales || []) {
      if (sale.transaction_type === "sale") {
        salesClosed++;
      } else if (sale.transaction_type === "rental") {
        rentalsClosed++;
      }
      totalCommission += sale.commission_amount || 0;
      totalRevenue += sale.sale_price || 0;
    }

    // Fetch deposits taken on this date
    const { count: depositsTaken } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("listing_status", "Kapora Alındı")
      .eq("deposit_date", dateStr);

    return {
      user_id: userId,
      office_id: officeId,
      stat_date: dateStr,
      total_activities: activityCounts.total,
      phone_calls: activityCounts.phone_calls,
      showings: activityCounts.showings,
      appointments: activityCounts.appointments,
      new_properties: newProperties || 0,
      new_customers: newCustomers || 0,
      sales_closed: salesClosed,
      rentals_closed: rentalsClosed,
      deposits_taken: depositsTaken || 0,
      total_commission: totalCommission,
      total_revenue: totalRevenue,
    };
  } catch (error) {
    console.error(`Error calculating stats for user ${userId}:`, error);
    return null;
  }
}
