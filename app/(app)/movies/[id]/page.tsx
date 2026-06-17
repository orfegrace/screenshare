"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StarDisplay } from "@/components/StarRating";
import { WatchlistModal } from "@/components/WatchlistModal";
import { useToast } from "@/components/Toast";
import type { Movie, WatchlistEntry } from "@/lib/types";
import type { EntryData } from "@/components/WatchlistModal";

interface FriendReview {
  username: string;
  rating: number | null;
  review: string | null;
}

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [myEntry, setMyEntry] = useState<WatchlistEntry | null>(null);
  const [friendReviews, setFriendReviews] = useState<FriendReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  async function load() {
    const res = await fetch(`/api/movies/${id}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setMovie(data.movie);
    setMyEntry(data.myEntry);
    setFriendReviews(data.friendReviews);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleSave(data: EntryData) {
    let res: Response;
    if (myEntry) {
      res = await fetch(`/api/watchlist/${myEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: data.status, rating: data.rating, review: data.review, watched_at: data.watched_at }),
      });
    } else {
      res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movie_id: id, status: data.status, rating: data.rating, review: data.review }),
      });
    }

    if (res.ok) {
      showToast("Saved.", "success");
      setEditOpen(false);
      load();
    } else {
      showToast("Failed to save.", "error");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="h-8 w-48 bg-[#111] border border-[#222] animate-pulse mb-4" />
        <div className="h-4 w-24 bg-[#111] border border-[#222] animate-pulse" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-[#888]">Movie not found.</p>
        <Link href="/movies" className="text-sm text-white underline mt-2 block">
          ← Back to My List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link
        href="/movies"
        className="text-xs text-[#888] hover:text-white transition-colors mb-6 block"
      >
        ← My List
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {movie.title}
          {movie.year && (
            <span className="text-[#888] font-normal text-lg ml-2">
              ({movie.year})
            </span>
          )}
        </h1>
      </div>

      {/* My entry */}
      <section className="border border-[#222] p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[#888] uppercase tracking-wider">
            My Rating
          </h2>
          <button
            onClick={() => setEditOpen(true)}
            className="text-xs text-[#888] hover:text-white transition-colors"
          >
            {myEntry ? "Edit" : "+ Add to list"}
          </button>
        </div>

        {myEntry ? (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-[#888] border border-[#222] px-2 py-0.5">
                {myEntry.status === "watched" ? "Watched" : "Want to Watch"}
              </span>
              {myEntry.rating !== null && <StarDisplay value={myEntry.rating} size="md" />}
            </div>
            {myEntry.review && (
              <p className="text-sm text-[#aaa] leading-relaxed">{myEntry.review}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#555]">
            You haven&apos;t logged this movie yet.
          </p>
        )}
      </section>

      {/* Friend reviews */}
      {friendReviews.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[#888] uppercase tracking-wider mb-4">
            Friends who watched this
          </h2>
          <ul className="space-y-px">
            {friendReviews.map((fr) => (
              <li key={fr.username} className="border border-[#222] p-4 bg-[#111]">
                <div className="flex items-center gap-3 mb-1.5">
                  <Link
                    href={`/profile/${fr.username}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {fr.username}
                  </Link>
                  {fr.rating !== null && <StarDisplay value={fr.rating} size="sm" />}
                </div>
                {fr.review && (
                  <p className="text-xs text-[#888] leading-relaxed">{fr.review}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {editOpen && (
        <WatchlistModal
          isOpen
          onClose={() => setEditOpen(false)}
          existing={myEntry ?? { id: "", user_id: "", movie_id: movie.id, status: "watched", rating: null, review: null, watched_at: null, created_at: "", movie }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
