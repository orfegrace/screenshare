import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { username: string } }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if friends
  const { data: friendship } = await supabase
    .from("friendships")
    .select("id")
    .eq("status", "accepted")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
    )
    .maybeSingle();

  const isFriend = !!friendship;

  // Get their watched movies (public)
  const { data: watchedEntries } = await supabase
    .from("watchlist")
    .select(`*, movie:movies(*)`)
    .eq("user_id", profile.id)
    .eq("status", "watched")
    .order("created_at", { ascending: false });

  return NextResponse.json({
    profile,
    watched: watchedEntries ?? [],
    isFriend,
  });
}
