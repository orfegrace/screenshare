"use client";

import { useEffect, useRef, useState } from "react";
import { StarDisplay } from "@/components/StarRating";
import { WatchlistModal, type EntryData } from "@/components/WatchlistModal";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { useToast } from "@/components/Toast";
import type { WatchlistEntry, WatchStatus } from "@/lib/types";

export default function MoviesPage() {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WatchlistEntry | null>(null);
  const [addingOpen, setAddingOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("card");
  const menuRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<WatchStatus | "">("");
  const [filterRating, setFilterRating] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"date" | "az" | "year">("date");

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchEntries() {
    setLoading(true);
    const res = await fetch("/api/watchlist");
    if (res.ok) setEntries(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchEntries(); }, []);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("Removed from your list.", "success");
    } else {
      showToast("Failed to delete.", "error");
    }
  }

  async function handleStatusChange(entryId: string, status: WatchStatus) {
    const res = await fetch(`/api/watchlist/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setEntries((prev) => prev.map((e) => e.id === entryId ? { ...e, status } : e));
      setEditing((prev) => prev?.id === entryId ? { ...prev, status } : prev);
    }
  }

  async function handleSave(data: EntryData) {
    if (editing) {
      const payload = {
        title: data.title,
        year: data.year,
        genre: data.genre,
        director: data.director,
        poster_url: data.poster_url,
      };
      console.log("Sending movie PATCH:", editing.movie_id, payload);
      // Update existing movie record
      const movieRes = await fetch(`/api/movies/${editing.movie_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const movieBody = await movieRes.json().catch(() => ({}));
      console.log("Movie PATCH response:", movieRes.status, JSON.stringify(movieBody));
      if (!movieRes.ok) {
        showToast(movieBody?.error ?? "Failed to update.", "error");
        return;
      }

      // Update watchlist entry
      const wlRes = await fetch(`/api/watchlist/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: data.status,
          rating: data.rating,
          review: data.review,
          watched_at: data.watched_at,
        }),
      });
      if (wlRes.ok) {
        showToast("Updated.", "success");
        setEditing(null);
        fetchEntries();
      } else {
        const err = await wlRes.json().catch(() => ({}));
        console.error("Watchlist PATCH failed:", err);
        showToast(err?.error ?? "Failed to update.", "error");
      }
    } else {
      // Create new movie
      const movieRes = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          year: data.year,
          genre: data.genre,
          director: data.director,
          poster_url: data.poster_url,
        }),
      });
      if (!movieRes.ok) { showToast("Failed to add.", "error"); return; }
      const movie = await movieRes.json();

      // Create watchlist entry
      const wlRes = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movie_id: movie.id,
          status: data.status,
          rating: data.rating,
          review: data.review,
          watched_at: data.watched_at,
        }),
      });
      if (wlRes.ok) {
        showToast("Added!", "success");
        setAddingOpen(false);
        fetchEntries();
      } else {
        showToast("Failed to add.", "error");
      }
    }
  }

  const skeletonCard = (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="aspect-[2/3] bg-[#111] border border-[#222] animate-pulse" />
      ))}
    </div>
  );

  const skeletonList = (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-[#111] border border-[#222] animate-pulse" />
      ))}
    </div>
  );

  const visibleEntries = entries
    .filter((e) => {
      if (filterStatus !== "" && e.status !== filterStatus) return false;
      if (filterRating !== "" && e.rating !== filterRating) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const inTitle = e.movie?.title?.toLowerCase().includes(q);
        const inDirector = e.movie?.director?.toLowerCase().includes(q);
        const inGenre = e.movie?.genre?.toLowerCase().includes(q);
        if (!inTitle && !inDirector && !inGenre) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "az") {
        return (a.movie?.title ?? "").localeCompare(b.movie?.title ?? "");
      }
      if (sortBy === "year") {
        return (b.movie?.year ?? 0) - (a.movie?.year ?? 0);
      }
      // date: most recent watched_at first, fallback to created_at
      const da = a.watched_at ?? a.created_at;
      const db = b.watched_at ?? b.created_at;
      return db.localeCompare(da);
    });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold tracking-tight">My List</h1>
        <ViewToggle view={view} onChange={setView} options={["card", "list"]} />
      </div>

      {/* Search + filter bar */}
      <div className="flex items-stretch gap-2 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, director, genre..."
            className="w-full h-full text-xs py-2 pl-3 pr-8 bg-[#111] border border-[#222] text-white placeholder-[#555] focus:border-[#888] focus:outline-none transition-colors"
          />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555] pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as WatchStatus | "")}
            className="h-full text-[9px] pl-2 pr-5 w-20 bg-[#111] border border-[#222] text-[#555] focus:border-[#888] focus:outline-none transition-colors appearance-none"
          >
            <option value="">Status</option>
            <option value="watched">Watched</option>
            <option value="want_to_watch">Want to Watch</option>
          </select>
          <svg className="absolute right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-[#444] pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        <div className="relative">
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value === "" ? "" : Number(e.target.value))}
            className="h-full text-[9px] pl-2 pr-5 w-20 bg-[#111] border border-[#222] text-[#555] focus:border-[#888] focus:outline-none transition-colors appearance-none"
          >
            <option value="">Rating</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{"★".repeat(r)}</option>
            ))}
          </select>
          <svg className="absolute right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-[#444] pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-full text-[9px] pl-2 pr-5 w-20 bg-[#111] border border-[#222] text-[#555] focus:border-[#888] focus:outline-none transition-colors appearance-none"
          >
            <option value="date">By date</option>
            <option value="az">A → Z</option>
            <option value="year">By year</option>
          </select>
          <svg className="absolute right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-[#444] pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Card view */}
      {view === "card" && (
        loading ? skeletonCard : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {visibleEntries.map((entry) => {
              const statusLabel = entry.status === "watched" ? "Watched" : "Want to Watch";
              return (
              <div key={entry.id} className="group relative cursor-pointer" onClick={() => setEditing(entry)}>
                <div className="flex flex-col bg-[#111] border border-[#222] overflow-hidden">
                  {/* Poster — true 3:4 */}
                  <div className="aspect-[3/4] overflow-hidden shrink-0">
                    {entry.movie?.poster_url ? (
                      <img
                        src={entry.movie.poster_url}
                        alt={entry.movie.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
                        <span className="text-xs text-[#444] text-center px-3 leading-snug">
                          {entry.movie?.title}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="px-2.5 py-2 flex flex-col gap-1 overflow-hidden">
                    <div className="flex flex-wrap gap-1">
                      {entry.movie?.genre && (
                        <span className="tag-chip text-[8px] text-[#666] bg-[#181818] px-1.5 py-0.5 leading-none tracking-wide">{entry.movie.genre}</span>
                      )}
                      <span className="tag-chip text-[8px] text-[#666] bg-[#181818] px-1.5 py-0.5 leading-none tracking-wide">{statusLabel}</span>
                    </div>
                    <p className="text-xs font-semibold leading-snug line-clamp-2">{entry.movie?.title}</p>
                    <p className="text-[8px] text-[#555] leading-tight">
                      {[entry.movie?.director, entry.movie?.year].filter(Boolean).join("  ·  ")}
                    </p>
                    {entry.rating && <StarDisplay value={entry.rating} size="sm" />}
                  </div>
                </div>
                {/* Three-dot menu */}
                <div
                  className="absolute top-1 right-1"
                  ref={menuOpen === entry.id ? menuRef : undefined}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === entry.id ? null : entry.id); }}
                    className="w-6 h-6 bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors opacity-0 group-hover:opacity-100 text-base leading-none"
                    title="Options"
                  >
                    ⋮
                  </button>
                  {menuOpen === entry.id && (
                    <div className="absolute right-0 top-7 w-28 bg-[#111] border border-[#222] py-1 shadow-xl z-10">
                      <button
                        onClick={() => { setEditing(entry); setMenuOpen(null); }}
                        className="w-full text-left px-3 py-2 text-xs text-[#ccc] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { handleDelete(entry.id); setMenuOpen(null); }}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-[#1a1a1a] transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ); })}

            {/* Add entry card */}
            <button
              onClick={() => setAddingOpen(true)}
              className="relative flex flex-col border border-dashed border-[#333] text-[#555] hover:text-white hover:border-[#888] transition-colors overflow-hidden"
            >
              <div className="aspect-[3/4] w-full" />
              <div className="h-20" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="text-2xl leading-none">+</span>
                <span className="text-[10px] uppercase tracking-widest">Add</span>
              </div>
            </button>
          </div>
        )
      )}

      {/* List view */}
      {view === "list" && (
        loading ? skeletonList : (
          <ul className="space-y-2">
            {visibleEntries.map((entry) => (
              <li
                key={entry.id}
                className="border border-[#222] bg-[#111] hover:border-[#333] transition-colors overflow-hidden"
              >
                <div className="flex h-32">
                  {/* Poster — full card height */}
                  <div className="w-24 shrink-0 cursor-pointer" onClick={() => setEditing(entry)}>
                    {entry.movie?.poster_url ? (
                      <img
                        src={entry.movie.poster_url}
                        alt={entry.movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
                        <span className="text-[#222] text-2xl">▶</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between px-4 py-3 cursor-pointer" onClick={() => setEditing(entry)}>
                    <div>
                      <p className="font-bold text-xl leading-snug line-clamp-2">{entry.movie?.title}</p>
                      <p className="text-[10px] text-[#555] mt-0.5">
                        {[entry.movie?.director, entry.movie?.year].filter(Boolean).join("  ·  ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {entry.movie?.genre && (
                        <span className="tag-chip text-[8px] text-[#666] bg-[#181818] px-1.5 py-0.5 leading-none">{entry.movie.genre}</span>
                      )}
                      <span className="tag-chip text-[8px] text-[#666] bg-[#181818] px-1.5 py-0.5 leading-none">
                        {entry.status === "watched" ? "Watched" : "Want to Watch"}
                      </span>
                      {entry.rating && <StarDisplay value={entry.rating} size="sm" />}
                    </div>
                  </div>

                  {/* Three dots menu */}
                  <div className="shrink-0 self-start pt-2 pr-2 relative" ref={menuOpen === entry.id ? menuRef : undefined}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === entry.id ? null : entry.id); }}
                      className="text-[#444] hover:text-white transition-colors px-1 text-base leading-none"
                    >
                      ⋮
                    </button>
                    {menuOpen === entry.id && (
                      <div className="absolute right-0 top-7 w-24 bg-[#0d0d0d] border border-[#222] py-1 shadow-xl z-10">
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(null); setEditing(entry); }}
                          className="w-full text-left px-3 py-2 text-xs text-[#ccc] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(null); handleDelete(entry.id); }}
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-[#1a1a1a] transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
            <li>
              <button
                onClick={() => setAddingOpen(true)}
                className="w-full h-32 flex items-center justify-center gap-2 border border-dashed border-[#333] text-[#555] hover:text-white hover:border-[#888] transition-colors"
              >
                <span className="text-xl leading-none">+</span>
                <span className="text-xs uppercase tracking-widest">Add</span>
              </button>
            </li>
          </ul>
        )
      )}

      {/* Edit existing entry */}
      {editing && (
        <WatchlistModal
          isOpen
          onClose={() => setEditing(null)}
          existing={editing}
          onSave={handleSave}
          onDelete={() => { handleDelete(editing.id); setEditing(null); }}
        />
      )}

      {/* Add new entry */}
      {addingOpen && (
        <WatchlistModal
          isOpen
          onClose={() => setAddingOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
