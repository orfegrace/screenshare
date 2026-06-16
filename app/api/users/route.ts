import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, bio, created_at")
    .ilike("username", `%${q}%`)
    .neq("id", user.id)
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Exclude existing friends / pending requests
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const connectedIds = new Set(
    (friendships ?? []).flatMap((f) => [f.requester_id, f.addressee_id])
  );
  connectedIds.delete(user.id);

  const filtered = (data ?? []).filter((p) => !connectedIds.has(p.id));
  return NextResponse.json(filtered);
}
