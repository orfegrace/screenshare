"use client";

import { useRef, useState } from "react";
import { Modal } from "./Modal";
import { StarRating, StarDisplay } from "./StarRating";
import type { WatchStatus, WatchlistEntry } from "@/lib/types";

export interface EntryData {
  title: string;
  year: number | null;
  genre: string | null;
  director: string | null;
  poster_url: string | null;
  status: WatchStatus;
  watched_at: string | null;
  rating: number | null;
  review: string;
}

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  existing?: WatchlistEntry | null;
  onSave: (data: EntryData) => Promise<void>;
  onDelete?: () => void;
  onStatusChange?: (status: WatchStatus) => void;
  readOnly?: boolean;
}

const GENRES = [
  "Adventure", "Animation", "Comedy", "Drama", "Fantasy",
  "Historical", "Horror", "Mystery", "Non-Fiction", "Romance", "Sci-Fi", "Thriller",
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-[#555] uppercase tracking-widest mb-1">{children}</p>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <Label>{label}</Label>
      <p className="text-sm text-white">{value || <span className="text-[#333]">—</span>}</p>
    </div>
  );
}

export function WatchlistModal({ isOpen, onClose, existing, onSave, onDelete, onStatusChange, readOnly }: WatchlistModalProps) {
  const isNew = !existing;
  const [mode, setMode] = useState<"view" | "edit">(isNew ? "edit" : "view");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(existing?.movie?.title ?? "");
  const [year, setYear] = useState(existing?.movie?.year?.toString() ?? "");
  const [genre, setGenre] = useState(existing?.movie?.genre ?? "");
  const [director, setDirector] = useState(existing?.movie?.director ?? "");
  const [status, setStatus] = useState<WatchStatus>(existing?.status ?? "watched");
  const [watchedAt, setWatchedAt] = useState(existing?.watched_at ?? "");
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [posterUrl, setPosterUrl] = useState(existing?.movie?.poster_url ?? "");
  const [review, setReview] = useState(existing?.review ?? "");

  function reset() {
    setTitle(existing?.movie?.title ?? "");
    setYear(existing?.movie?.year?.toString() ?? "");
    setGenre(existing?.movie?.genre ?? "");
    setDirector(existing?.movie?.director ?? "");
    setStatus(existing?.status ?? "watched");
    setWatchedAt(existing?.watched_at ?? "");
    setRating(existing?.rating ?? null);
    setPosterUrl(existing?.movie?.poster_url ?? "");
    setReview(existing?.review ?? "");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await onSave({
      title: title.trim(),
      year: year ? Number(year) : null,
      genre: genre || null,
      director: director.trim() || null,
      poster_url: posterUrl.trim() || null,
      status,
      watched_at: watchedAt || null,
      rating,
      review,
    });
    setLoading(false);
    if (!isNew) setMode("view");
  }

  const dotsMenu = (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="text-[#555] hover:text-white transition-colors px-1 text-base leading-none"
      >
        ⋮
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-6 w-28 bg-[#0d0d0d] border border-[#222] py-1 shadow-xl z-10">
          {mode === "view" && (
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setMode("edit"); }}
              className="w-full text-left px-3 py-2 text-xs text-[#ccc] hover:text-white hover:bg-[#1a1a1a] transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onDelete(); }}
              className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-[#1a1a1a] transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );

  const displayDate = existing?.watched_at
    ? new Date(existing.watched_at + "T00:00:00").toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
    : null;

  /* ── VIEW MODE — Notion-style page ── */
  if (mode === "view" && existing) {
    if (!isOpen) return null;
    const props: { label: string; value: React.ReactNode }[] = [
      {
        label: "Status",
        value: onStatusChange ? (
          <div className="flex gap-1">
            {(["watched", "want_to_watch"] as WatchStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onStatusChange(s)}
                className={`px-2 py-0.5 text-[11px] border transition-colors ${
                  existing.status === s
                    ? "bg-white text-black border-white"
                    : "text-[#555] border-[#333] hover:text-white hover:border-[#666]"
                }`}
              >
                {s === "watched" ? "Watched" : "Want to Watch"}
              </button>
            ))}
          </div>
        ) : (existing.status === "watched" ? "Watched" : "Want to Watch"),
      },
      { label: "Genre", value: existing.movie?.genre ?? <span className="text-[#333]">—</span> },
      { label: "Director", value: existing.movie?.director ?? <span className="text-[#333]">—</span> },
      { label: "Year", value: existing.movie?.year ?? <span className="text-[#333]">—</span> },
      { label: "Date watched", value: displayDate ?? <span className="text-[#333]">—</span> },
      {
        label: "Rating",
        value: <StarDisplay value={existing.rating} size="md" />,
      },
      {
        label: "Notes",
        value: existing.review
          ? <span className="leading-relaxed whitespace-pre-wrap">{existing.review}</span>
          : <span className="text-[#333]">—</span>,
      },
    ];

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        onClick={onClose}
      >
        <div
          className="bg-[#111] border border-[#222] w-full max-w-xl mx-4 flex flex-col max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cover image or plain header bar */}
          <div className="relative shrink-0">
            {existing.movie?.poster_url ? (
              <img
                src={existing.movie.poster_url}
                alt=""
                className="w-full h-52 object-cover"
              />
            ) : (
              <div className="w-full h-10 bg-[#0d0d0d]" />
            )}
            {/* Floating controls — ⋮ and ✕ side by side */}
            <div className="absolute top-2 right-2 flex gap-1">
              {!readOnly && (
                <div className="w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-black/90 transition-colors relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="text-[#aaa] hover:text-white transition-colors text-base leading-none"
                  >
                    ⋮
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-8 w-28 bg-[#0d0d0d] border border-[#222] py-1 shadow-xl z-10">
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); setMode("edit"); }}
                        className="w-full text-left px-3 py-2 text-xs text-[#ccc] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                      >
                        Edit
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => { setMenuOpen(false); onDelete(); }}
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-[#1a1a1a] transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-black/90 text-[#aaa] hover:text-white transition-colors text-sm leading-none"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-7 py-6">
            {/* Title */}
            <h1 className="text-2xl font-bold leading-tight mb-6">
              {existing.movie?.title ?? "Untitled"}
            </h1>

            {/* Property rows */}
            <div className="space-y-0">
              {props.map(({ label, value }) => (
                <div key={label} className="flex items-start py-1.5 border-b border-[#1a1a1a] last:border-0">
                  <span className="text-[11px] text-[#555] w-28 shrink-0 uppercase tracking-widest pt-0.5">{label}</span>
                  <span className="text-sm text-[#ccc]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── EDIT / NEW MODE ── */
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isNew ? "Add Entry" : "Edit Entry"}
      headerExtra={undefined}
      footer={
        <div className="flex gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={() => { reset(); setMode("view"); }}
              className="flex-1 py-2 text-sm border border-[#222] text-[#666] hover:text-white hover:border-[#555] transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            form="entry-form"
            type="submit"
            disabled={loading || !title.trim()}
            className="flex-1 py-2 text-sm bg-white text-black hover:bg-[#ddd] disabled:opacity-40 transition-colors"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      }
    >
      <form id="entry-form" onSubmit={handleSave} className="flex flex-col gap-4">
        {/* Cover preview */}
        {posterUrl && (
          <img src={posterUrl} alt="" className="h-16 w-11 object-cover border border-[#1e1e1e] shrink-0" />
        )}

        {/* Status — full width at top */}
        <div className="flex w-full">
          {(["watched", "want_to_watch"] as WatchStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`flex-1 py-3 text-sm font-medium border transition-colors ${
                status === s
                  ? "bg-white text-black border-white"
                  : "text-[#555] border-[#222] hover:text-white hover:border-[#555]"
              }`}
            >
              {s === "watched" ? "Watched" : "Want to Watch"}
            </button>
          ))}
        </div>

        {/* Title + Year */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-1">
            <Label>Title <span className="text-white normal-case">*</span></Label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dune"
              required
            />
          </div>
          <div>
            <Label>Year</Label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2021"
              min="1800"
              max="2100"
            />
          </div>
        </div>

        {/* Genre + Director */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Genre</Label>
            <div className="relative">
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full appearance-none pr-6"
              >
                <option value="">— Select —</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#555] pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
          <div>
            <Label>Director</Label>
            <input
              type="text"
              value={director}
              onChange={(e) => setDirector(e.target.value)}
              placeholder="e.g. Denis Villeneuve"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <Label>Date</Label>
          <input
            type="date"
            value={watchedAt}
            onChange={(e) => setWatchedAt(e.target.value)}
          />
        </div>

        {/* Rating */}
        <div>
          <Label>Your Rating</Label>
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>

        {/* Cover URL */}
        <div>
          <Label>Cover Image URL <span className="normal-case font-normal text-[#444]">(optional)</span></Label>
          <input
            type="text"
            value={posterUrl}
            onChange={(e) => setPosterUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>

        {/* Notes */}
        <div>
          <Label>Notes</Label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={2}
            placeholder="Thoughts, favourite quotes, why you loved it…"
            className="resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
