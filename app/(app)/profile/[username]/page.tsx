"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StarDisplay } from "@/components/StarRating";
import { useToast } from "@/components/Toast";
import type { Profile, WatchlistEntry } from "@/lib/types";

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [watched, setWatched] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setProfile(data.profile);
      setWatched(data.watched);
      setIsFriend(data.isFriend);
      setLoading(false);
    }
    load();
  }, [username]);

  async function handleMessage() {
    if (!profile) return;
    setMsgLoading(true);
    router.push(`/messages?with=${profile.id}`);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="h-8 w-40 bg-[#111] border border-[#222] animate-pulse mb-4" />
        <div className="h-4 w-64 bg-[#111] border border-[#222] animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-[#888]">User not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link
        href="/friends"
        className="text-xs text-[#888] hover:text-white transition-colors mb-6 block"
      >
        ← Friends
      </Link>

      <div className="border border-[#222] p-6 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight mb-1">
              {profile.username}
            </h1>
            {profile.bio && (
              <p className="text-sm text-[#888] mb-2">{profile.bio}</p>
            )}
            <p className="text-xs text-[#555]">
              Joined{" "}
              {new Date(profile.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {isFriend && (
            <button
              onClick={handleMessage}
              disabled={msgLoading}
              className="text-sm px-4 py-2 bg-white text-black hover:bg-[#ddd] disabled:opacity-50 transition-colors shrink-0"
            >
              {msgLoading ? "..." : "Send Message"}
            </button>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-[#888] uppercase tracking-wider mb-4">
          Watched ({watched.length})
        </h2>

        {watched.length === 0 ? (
          <div className="border border-[#222] p-6 text-center">
            <p className="text-[#888] text-sm">No movies watched yet.</p>
          </div>
        ) : (
          <ul className="space-y-px">
            {watched.map((entry) => (
              <li key={entry.id} className="border border-[#222] p-4 bg-[#111]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      {entry.movie?.title}
                      {entry.movie?.year && (
                        <span className="text-[#888] font-normal ml-1.5">
                          ({entry.movie.year})
                        </span>
                      )}
                    </p>
                    {entry.rating !== null && (
                      <div className="mt-1">
                        <StarDisplay value={entry.rating} size="sm" />
                      </div>
                    )}
                    {entry.review && (
                      <p className="text-xs text-[#888] mt-1 leading-relaxed">
                        {entry.review}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-[#555] shrink-0">
                    {new Date(entry.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
