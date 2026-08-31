import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get total registered users
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (usersError) throw usersError;

    // Get total games played
    const { count: totalGames, error: gamesError } = await supabaseAdmin
      .from("game_results")
      .select("*", { count: "exact", head: true });

    if (gamesError) throw gamesError;

    // Get total solved games
    const { count: totalSolved, error: solvedError } = await supabaseAdmin
      .from("game_results")
      .select("*", { count: "exact", head: true })
      .eq("solved", true);

    if (solvedError) throw solvedError;

    // Get daily games stats
    const { count: dailyGames, error: dailyError } = await supabaseAdmin
      .from("game_results")
      .select("*", { count: "exact", head: true })
      .eq("mode", "daily");

    if (dailyError) throw dailyError;

    const { count: dailySolved, error: dailySolvedError } = await supabaseAdmin
      .from("game_results")
      .select("*", { count: "exact", head: true })
      .eq("mode", "daily")
      .eq("solved", true);

    if (dailySolvedError) throw dailySolvedError;

    const globalWinRate =
      totalGames && totalGames > 0 ? totalSolved / totalGames : 0;
    const dailyWinRate =
      dailyGames && dailyGames > 0 ? dailySolved / dailyGames : 0;

    // Get guess distribution for solved games
    const { data: solvedGames, error: solvedGamesError } = await supabaseAdmin
      .from("game_results")
      .select("guesses_count")
      .eq("solved", true)
      .gte("guesses_count", 1)
      .lte("guesses_count", 6);

    if (solvedGamesError) throw solvedGamesError;

    // Calculate guess distribution
    const guessDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };

    for (const game of solvedGames || []) {
      if (game.guesses_count >= 1 && game.guesses_count <= 6) {
        guessDistribution[game.guesses_count]++;
      }
    }

    return new Response(
      JSON.stringify({
        totalUsers: totalUsers ?? 0,
        totalGames: totalGames ?? 0,
        totalSolved: totalSolved ?? 0,
        globalWinRate,
        dailyGames: dailyGames ?? 0,
        dailySolved: dailySolved ?? 0,
        dailyWinRate,
        guessDistribution,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});