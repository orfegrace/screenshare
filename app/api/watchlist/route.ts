import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");

  let query = supabase
    .from("watchlist")
    .select(`*, movie:movies(*)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status === "watched" || status === "want_to_watch") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { movie_id, status, rating, review } = body;

  if (!movie_id) return NextResponse.json({ error: "movie_id required" }, { status: 400 });
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

  const { data, error } = await supabase
    .from("watchlist")
    .insert({
      user_id: user.id,
      movie_id,
      status,
      rating: rating ?? null,
      review: review || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
