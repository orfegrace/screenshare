"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StarDisplay } from "@/components/StarRating";
import { WatchlistModal } from "@/components/WatchlistModal";
import { useToast } from "@/components/Toast";
import type { WatchlistEntry, WatchStatus } from "@/lib/types";

type Tab = "watched" | "want_to_watch";

export default function MoviesPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("watched");
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WatchlistEntry | null>(null);

  async function fetchEntries() {
    const res = await fetch(`/api/watchlist?status=${tab}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("Removed from your list.", "success");
    } else {
      showToast("Failed to delete.", "error");
    }
  }

  async function handleSave(data: {
    status: WatchStatus;
    rating: number | null;
    review: string;
  }) {
    if (!editing) return;
    const res = await fetch(`/api/watchlist/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      showToast("Updated.", "success");
      setEditing(null);
      setLoading(true);
      fetchEntries();
    } else {
      showToast("Failed to update.", "error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold tracking-tight">My List</h1>
        <Link
          href="/movies/add"
          className="text-sm px-3 py-1.5 bg-white text-black hover:bg-[#ddd] transition-colors"
        >
          + Add movie
        </Link>
      </div>

      <div className="flex border-b border-[#222] mb-6">
        {(["watched", "want_to_watch"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
              tab === t
                ? "text-white border-white"
                : "text-[#888] border-transparent hover:text-white"
            }`}
          >
            {t === "watched" ? "Watched" : "Want to Watch"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-[#111] border border-[#222] animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="border border-[#222] p-8 text-center">
          <p className="text-[#888] text-sm mb-4">
            {tab === "watched"
              ? "No movies watched yet. Add your first one →"
              : "Nothing on your watchlist. Add movies you want to see →"}
          </p>
          <Link
            href="/movies/add"
            className="text-sm px-4 py-2 bg-white text-black hover:bg-[#ddd] transition-colors"
          >
            Add a movie →
          </Link>
        </div>
      ) : (
        <ul className="space-y-px">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="border border-[#222] p-4 bg-[#111] group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/movies/${entry.movie_id}`}
                    className="font-medium text-sm hover:underline"
                  >
                    {entry.movie?.title}
                    {entry.movie?.year && (
                      <span className="text-[#888] font-normal ml-1.5">
                        ({entry.movie.year})
                      </span>
                    )}
                  </Link>

                  {tab === "watched" && (
                    <div className="mt-1 flex items-center gap-3">
                      <StarDisplay value={entry.rating} size="sm" />
                      {entry.review && (
                        <p className="text-xs text-[#888] truncate max-w-xs">
                          {entry.review}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditing(entry)}
                    className="text-xs text-[#555] hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-xs text-[#555] hover:text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <WatchlistModal
          isOpen
          onClose={() => setEditing(null)}
          movieTitle={editing.movie?.title ?? ""}
          movieId={editing.movie_id}
          existing={editing}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
