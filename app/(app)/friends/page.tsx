"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import type { Profile, Friendship } from "@/lib/types";

type FriendsTab = "friends" | "search" | "pending";

interface FriendWithProfile extends Friendship {
  profile: Profile;
}

interface PendingRequest extends Friendship {
  requester_profile: Profile;
}

export default function FriendsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<FriendsTab>("friends");
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  async function fetchFriends() {
    const res = await fetch("/api/friends");
    if (res.ok) {
      const data = await res.json();
      setFriends(data.friends ?? []);
      setPending(data.pending ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchFriends(); }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/users?q=${encodeURIComponent(searchQuery)}`);
    if (res.ok) {
      const data = await res.json();
      setSearchResults(data);
    }
    setSearching(false);
  }

  async function sendRequest(addresseeId: string) {
    setActionLoading(addresseeId);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressee_id: addresseeId }),
    });
    setActionLoading(null);
    if (res.ok) {
      showToast("Friend request sent!", "success");
      setRequested((prev) => new Set(prev).add(addresseeId));
    } else {
      const body = await res.json();
      showToast(body.error ?? "Failed to send request.", "error");
    }
  }

  async function respondToRequest(id: string, accept: boolean) {
    setActionLoading(id);
    const res = await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: accept ? "accepted" : "declined" }),
    });
    setActionLoading(null);
    if (res.ok) {
      showToast(accept ? "Friend added!" : "Request declined.", "success");
      if (!accept) {
        const req = pending.find((p) => p.id === id);
        if (req) setRequested((prev) => { const s = new Set(prev); s.delete(req.requester_profile.id); return s; });
      }
      await fetchFriends();
    } else {
      showToast("Failed to respond.", "error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight mb-8">Friends</h1>

      <div className="flex border-b border-[#222] mb-6">
        {(["friends", "search", "pending"] as FriendsTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px capitalize relative ${
              tab === t
                ? "text-white border-white"
                : "text-[#888] border-transparent hover:text-white"
            }`}
          >
            {t === "pending" ? "Requests" : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "pending" && pending.length > 0 && (
              <span className="ml-1.5 bg-white text-black text-xs rounded-full px-1.5 py-0.5">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "friends" && (
        <div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-[#111] border border-[#222] animate-pulse" />
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="border border-[#222] p-8 text-center">
              <p className="text-[#888] text-sm mb-4">No friends yet. Search for users to add.</p>
              <button
                onClick={() => setTab("search")}
                className="text-sm px-4 py-2 bg-white text-black hover:bg-[#ddd] transition-colors"
              >
                Search users →
              </button>
            </div>
          ) : (
            <ul className="space-y-px">
              {friends.map((f) => (
                <li key={f.id} className="border border-[#222] p-4 bg-[#111] flex items-center justify-between">
                  <div>
                    <Link
                      href={`/profile/${f.profile.username}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {f.profile.username}
                    </Link>
                    {f.profile.bio && (
                      <p className="text-xs text-[#888] mt-0.5 truncate max-w-xs">{f.profile.bio}</p>
                    )}
                  </div>
                  <Link
                    href={`/profile/${f.profile.username}`}
                    className="text-xs text-[#888] hover:text-white transition-colors"
                  >
                    View profile →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "search" && (
        <div>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
            />
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2 bg-white text-black text-sm hover:bg-[#ddd] disabled:opacity-50 transition-colors shrink-0"
            >
              {searching ? "..." : "Search"}
            </button>
          </form>

          {searchResults.length === 0 && searchQuery && !searching && (
            <p className="text-[#888] text-sm">No users found for &quot;{searchQuery}&quot;.</p>
          )}

          <ul className="space-y-px">
            {searchResults.map((user) => (
              <li key={user.id} className="border border-[#222] p-4 bg-[#111] flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{user.username}</p>
                  {user.bio && (
                    <p className="text-xs text-[#888] mt-0.5">{user.bio}</p>
                  )}
                </div>
                <button
                  onClick={() => sendRequest(user.id)}
                  disabled={actionLoading === user.id || requested.has(user.id)}
                  className="text-xs px-3 py-1.5 bg-white text-black hover:bg-[#ddd] disabled:opacity-50 transition-colors"
                >
                  {actionLoading === user.id ? "..." : requested.has(user.id) ? "Requested" : "Request"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "pending" && (
        <div>
          {pending.length === 0 ? (
            <div className="border border-[#222] p-8 text-center">
              <p className="text-[#888] text-sm">No pending friend requests.</p>
            </div>
          ) : (
            <ul className="space-y-px">
              {pending.map((req) => (
                <li key={req.id} className="border border-[#222] p-4 bg-[#111] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{req.requester_profile.username}</p>
                    <p className="text-xs text-[#888] mt-0.5">wants to be friends</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToRequest(req.id, true)}
                      disabled={actionLoading === req.id}
                      className="text-xs px-3 py-1.5 bg-white text-black hover:bg-[#ddd] disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === req.id ? "..." : "Accept"}
                    </button>
                    <button
                      onClick={() => respondToRequest(req.id, false)}
                      disabled={actionLoading === req.id}
                      className="text-xs px-3 py-1.5 border border-[#222] text-[#888] hover:text-white hover:border-[#888] disabled:opacity-50 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
