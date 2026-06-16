import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Stats
  const { count: watched } = await supabase
    .from("watchlist")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "watched");

  const { count: wantToWatch } = await supabase
    .from("watchlist")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "want_to_watch");

  const { data: ratings } = await supabase
    .from("watchlist")
    .select("rating")
    .eq("user_id", user.id)
    .eq("status", "watched")
    .not("rating", "is", null);

  let avgRating: number | null = null;
  if (ratings && ratings.length > 0) {
    const sum = ratings.reduce((acc, r) => acc + (r.rating ?? 0), 0);
    avgRating = sum / ratings.length;
  }

  return NextResponse.json({
    profile,
    stats: { watched: watched ?? 0, wantToWatch: wantToWatch ?? 0, avgRating },
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username, bio } = await request.json();

  if (!username?.trim()) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username: username.trim(), bio: bio || null })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
