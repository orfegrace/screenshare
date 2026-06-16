import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Accepted friends
  const { data: acceptedFriendships } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status, created_at")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const friendIds = (acceptedFriendships ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  let friendsWithProfiles: unknown[] = [];
  if (friendIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, bio, created_at")
      .in("id", friendIds);

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    friendsWithProfiles = (acceptedFriendships ?? []).map((f) => {
      const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      return { ...f, profile: profileMap[friendId] };
    });
  }

  // Pending requests addressed to me
  const { data: pendingFriendships } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status, created_at")
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  let pendingWithProfiles: unknown[] = [];
  if ((pendingFriendships ?? []).length > 0) {
    const requesterIds = (pendingFriendships ?? []).map((f) => f.requester_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, bio, created_at")
      .in("id", requesterIds);

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    pendingWithProfiles = (pendingFriendships ?? []).map((f) => ({
      ...f,
      requester_profile: profileMap[f.requester_id],
    }));
  }

  return NextResponse.json({ friends: friendsWithProfiles, pending: pendingWithProfiles });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { addressee_id } = await request.json();
  if (!addressee_id) return NextResponse.json({ error: "addressee_id required" }, { status: 400 });
  if (addressee_id === user.id) return NextResponse.json({ error: "Cannot friend yourself." }, { status: 400 });

  // Check existing
  const { data: existing } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${addressee_id}),and(requester_id.eq.${addressee_id},addressee_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Friend request already exists." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id, status: "pending" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
