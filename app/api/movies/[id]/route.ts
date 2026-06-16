import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: movie, error } = await supabase
    .from("movies")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !movie) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  // My watchlist entry
  const { data: myEntry } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", user.id)
    .eq("movie_id", params.id)
    .maybeSingle();

  // Get friend reviews — find same title across all friends' movies
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const friendIds = (friendships ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  let friendReviews: { username: string; rating: number | null; review: string | null }[] = [];

  if (friendIds.length > 0) {
    // Find movies with the same title added by friends
    const { data: sameMovies } = await supabase
      .from("movies")
      .select("id, user_id")
      .ilike("title", movie.title)
      .in("user_id", friendIds);

    if (sameMovies && sameMovies.length > 0) {
      const sameMovieIds = sameMovies.map((m) => m.id);
      const ownerMap = Object.fromEntries(sameMovies.map((m) => [m.id, m.user_id]));

      const { data: entries } = await supabase
        .from("watchlist")
        .select("movie_id, rating, review, user_id")
        .in("movie_id", sameMovieIds)
        .eq("status", "watched");

      if (entries && entries.length > 0) {
        const userIds = Array.from(new Set(entries.map((e) => e.user_id)));
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);
        const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.username]));

        friendReviews = entries.map((e) => ({
          username: profileMap[e.user_id] ?? "unknown",
          rating: e.rating,
          review: e.review,
        }));
      }
    }
  }

  return NextResponse.json({ movie, myEntry: myEntry ?? null, friendReviews });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("movies")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
