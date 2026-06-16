import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all messages involving current user
  const { data: messages } = await supabase
    .from("messages")
    .select("sender_id, receiver_id, content, created_at, read")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (!messages) return NextResponse.json([]);

  // Build conversations by grouping by the other person
  const convoMap = new Map<string, {
    last_message: string;
    last_message_at: string;
    unread_count: number;
  }>();

  for (const msg of messages) {
    const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    if (!convoMap.has(otherId)) {
      convoMap.set(otherId, {
        last_message: msg.content,
        last_message_at: msg.created_at,
        unread_count: 0,
      });
    }
    if (!msg.read && msg.receiver_id === user.id) {
      const c = convoMap.get(otherId)!;
      c.unread_count += 1;
    }
  }

  const otherIds = [...convoMap.keys()];
  if (otherIds.length === 0) return NextResponse.json([]);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", otherIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.username]));

  const conversations = otherIds.map((id) => {
    const c = convoMap.get(id)!;
    return {
      friend_id: id,
      username: profileMap[id] ?? "Unknown",
      last_message: c.last_message,
      last_message_at: c.last_message_at,
      unread_count: c.unread_count,
    };
  });

  return NextResponse.json(conversations);
}
