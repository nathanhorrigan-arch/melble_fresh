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

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const sortBy = url.searchParams.get("sortBy") || "points";

    // Get all profiles with their game results aggregated
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name");

    if (profilesError) throw profilesError;

    // Get all game results
    const { data: results, error: resultsError } = await supabaseAdmin
      .from("game_results")
      .select("user_id, mode, score, guesses_count, solved, closest_distance_m, played_at");

    if (resultsError) throw resultsError;

    // Aggregate stats per user
    const userStats = new Map<string, {
      userId: string;
      displayName: string;
      totalPoints: number;
      totalGames: number;
      solvedGames: number;
      dailyGames: number;
      dailySolved: number;
      dailyPoints: number;
      maxStreak: number;
      currentStreak: number;
      avgGuesses: number;
      totalGuesses: number;
      totalDistance: number;
    }>();

    // Initialize user stats
    for (const profile of profiles || []) {
      userStats.set(profile.id, {
        userId: profile.id,
        displayName: profile.display_name,
        totalPoints: 0,
        totalGames: 0,
        solvedGames: 0,
        dailyGames: 0,
        dailySolved: 0,
        dailyPoints: 0,
        maxStreak: 0,
        currentStreak: 0,
        avgGuesses: 0,
        totalGuesses: 0,
        totalDistance: 0,
      });
    }

    // Process game results
    const userResults = new Map<string, typeof results>();
    for (const result of results || []) {
      if (!userResults.has(result.user_id)) {
        userResults.set(result.user_id, []);
      }
      userResults.get(result.user_id)!.push(result);
    }

    for (const [userId, userResultList] of userResults.entries()) {
      const stats = userStats.get(userId);
      if (!stats) continue;

      // Sort by played_at for streak calculation
      const sortedResults = userResultList.sort(
        (a, b) =>
          new Date(a.played_at).getTime() - new Date(b.played_at).getTime()
      );

      let currentStreak = 0;
      let maxStreak = 0;
      let totalGuesses = 0;
      let solvedForAvg = 0;
      let lastSolvedDateStr = "";

      for (const result of sortedResults) {
        stats.totalGames++;
        stats.totalDistance += result.closest_distance_m;

        if (result.mode === "daily") {
          stats.dailyGames++;
          stats.dailyPoints += result.score;
        }

        if (result.solved) {
          stats.solvedGames++;
          totalGuesses += result.guesses_count;
          solvedForAvg++;

          if (result.mode === "daily") {
            stats.dailySolved++;
          }
        }

        // Calculate streaks for daily games only (calendar-day based)
        if (result.mode === "daily") {
          if (result.solved) {
            const resultDate = new Date(result.played_at);
            const resultStr = resultDate.toISOString().split("T")[0];
            if (lastSolvedDateStr) {
              const lastDate = new Date(lastSolvedDateStr + "T00:00:00Z");
              const diffDays = Math.round(
                (resultDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (diffDays === 1) {
                currentStreak++;
              } else {
                currentStreak = 1;
              }
            } else {
              currentStreak = 1;
            }
            lastSolvedDateStr = resultStr;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        }
      }

      stats.totalPoints = stats.dailyPoints;
      stats.maxStreak = maxStreak;
      stats.currentStreak = currentStreak;
      stats.avgGuesses = solvedForAvg > 0 ? totalGuesses / solvedForAvg : 0;
    }

    // Convert to array and filter users with at least 1 game
    const leaderboard = Array.from(userStats.values())
      .filter((s) => s.totalGames > 0)
      .map((s) => ({
        ...s,
        winRate: s.totalGames > 0 ? s.solvedGames / s.totalGames : 0,
        dailyWinRate: s.dailyGames > 0 ? s.dailySolved / s.dailyGames : 0,
        avgDistance:
          s.totalGames > 0 ? Math.round(s.totalDistance / s.totalGames) : 0,
      }))
      .sort((a, b) => {
        switch (sortBy) {
          case "winRate":
            return b.winRate - a.winRate;
          case "streak":
            return b.maxStreak - a.maxStreak;
          case "currentStreak":
            return b.currentStreak - a.currentStreak;
          case "avgGuesses":
            return a.avgGuesses - b.avgGuesses;
          case "avgDistance":
            return a.avgDistance - b.avgDistance;
          case "points":
          default:
            return b.totalPoints - a.totalPoints;
        }
      })
      .slice(0, limit)
      .map((s, index) => ({
        rank: index + 1,
        displayName: s.displayName,
        totalPoints: s.totalPoints,
        totalGames: s.totalGames,
        solvedGames: s.solvedGames,
        winRate: s.winRate,
        dailyWinRate: s.dailyWinRate,
        maxStreak: s.maxStreak,
        currentStreak: s.currentStreak,
        avgGuesses: s.avgGuesses,
        avgDistance: s.avgDistance,
      }));

    return new Response(
      JSON.stringify({ leaderboard }),
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