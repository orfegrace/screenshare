"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { StarRating } from "./StarRating";
import type { WatchStatus, WatchlistEntry } from "@/lib/types";

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieTitle: string;
  movieId: string;
  existing?: WatchlistEntry | null;
  onSave: (data: {
    status: WatchStatus;
    rating: number | null;
    review: string;
  }) => Promise<void>;
}

export function WatchlistModal({
  isOpen,
  onClose,
  movieTitle,
  existing,
  onSave,
}: WatchlistModalProps) {
  const [status, setStatus] = useState<WatchStatus>(
    existing?.status ?? "watched"
  );
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [review, setReview] = useState(existing?.review ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSave({ status, rating, review });
    setLoading(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={movieTitle}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2">
          {(["watched", "want_to_watch"] as WatchStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`flex-1 py-2 text-sm border transition-colors ${
                status === s
                  ? "bg-white text-black border-white"
                  : "bg-black text-[#888] border-[#222] hover:text-white hover:border-[#888]"
              }`}
            >
              {s === "watched" ? "Watched" : "Want to Watch"}
            </button>
          ))}
        </div>

        {status === "watched" && (
          <>
            <div>
              <label className="block text-xs text-[#888] mb-2">Rating</label>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>
            <div>
              <label className="block text-xs text-[#888] mb-2">Review</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                placeholder="Write a short review..."
                className="resize-none"
              />
            </div>
          </>
        )}

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-sm border border-[#222] text-[#888] hover:text-white hover:border-[#888] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 text-sm bg-white text-black hover:bg-[#ddd] disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
