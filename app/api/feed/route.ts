import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get accepted friend IDs
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const friendIds = (friendships ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  const allUserIds = [user.id, ...friendIds];

  // Fetch watchlist entries with movies and profiles
  const { data: entries } = await supabase
    .from("watchlist")
    .select(`
      id, status, rating, review, watched_at, created_at, user_id,
      movie:movies(title, year, genre, director, poster_url)
    `)
    .in("user_id", allUserIds)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!entries) return NextResponse.json([]);

  // Get profiles for all user_ids
  const userIds = Array.from(new Set(entries.map((e) => e.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", userIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.username]));

  const feed = entries.map((e) => {
    const movie = Array.isArray(e.movie) ? e.movie[0] : e.movie;
    return {
      id: e.id,
      username: profileMap[e.user_id] ?? "unknown",
      action: e.status,
      movie_title: movie?.title ?? "",
      movie_year: movie?.year ?? null,
      movie_genre: movie?.genre ?? null,
      movie_director: movie?.director ?? null,
      movie_poster_url: movie?.poster_url ?? null,
      rating: e.rating,
      review: e.review,
      watched_at: e.watched_at ?? null,
      created_at: e.created_at,
    };
  });

  return NextResponse.json(feed);
}
