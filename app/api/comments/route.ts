import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entry_id = request.nextUrl.searchParams.get("entry_id");
  if (!entry_id) return NextResponse.json({ error: "entry_id required" }, { status: 400 });

  const { data: comments, error } = await supabase
    .from("entry_comments")
    .select("id, content, created_at, user_id, profiles(username)")
    .eq("entry_id", entry_id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(comments ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entry_id, content } = await request.json();
  if (!entry_id || !content?.trim()) {
    return NextResponse.json({ error: "entry_id and content required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("entry_comments")
    .insert({ entry_id, user_id: user.id, content: content.trim() })
    .select("id, content, created_at, user_id, profiles(username)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("entry_comments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
