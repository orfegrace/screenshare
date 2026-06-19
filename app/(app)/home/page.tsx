"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { StarDisplay } from "@/components/StarRating";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { WatchlistModal } from "@/components/WatchlistModal";
import type { FeedItem, WatchlistEntry } from "@/lib/types";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { username: string } | null;
}

function CommentSection({ entryId }: { entryId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/comments?entry_id=${entryId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
        else setError(data.error ?? "Failed to load comments");
        setLoading(false);
      });
  }, [entryId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    setError(null);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry_id: entryId, content: text.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setComments((prev) => [...prev, data]);
      setText("");
    } else {
      setError(data.error ?? "Failed to post comment");
    }
    setPosting(false);
    inputRef.current?.focus();
  }

  async function deleteComment(id: string) {
    const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
      {error && <p className="text-[10px] text-red-400 mb-2">{error}</p>}
      {loading ? (
        <p className="text-[10px] text-[#444] mb-2">Loading...</p>
      ) : comments.length > 0 ? (
        <ul className="space-y-1.5 mb-2">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-1.5 group/comment">
              <span className="text-[11px] font-medium text-[#888] shrink-0">
                {c.profiles?.username ?? "unknown"}
              </span>
              <span className="text-[11px] text-[#aaa] leading-tight">{c.content}</span>
              <button
                onClick={() => deleteComment(c.id)}
                className="ml-auto text-[10px] text-[#333] hover:text-red-400 transition-colors opacity-0 group-hover/comment:opacity-100 shrink-0"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] text-[#444] mb-2">No comments yet.</p>
      )}
      <form onSubmit={submit} className="flex gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 text-[11px] py-1 px-2 bg-[#0a0a0a] border border-[#1e1e1e] text-white placeholder-[#444] focus:border-[#444] focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={posting || !text.trim()}
          className="text-[10px] px-2.5 py-1 bg-[#1a1a1a] text-[#888] hover:text-white hover:bg-[#222] disabled:opacity-40 transition-colors border border-[#222]"
        >
          Post
        </button>
      </form>
    </div>
  );
}

function CommentToggle({ entryId, className }: { entryId: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] text-[#444] hover:text-[#888] transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>{open ? "Hide comments" : "Comment"}</span>
      </button>
      {open && <CommentSection entryId={entryId} />}
    </div>
  );
}

export default function HomePage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [viewing, setViewing] = useState<WatchlistEntry | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/feed");
      if (res.ok) {
        const data = await res.json();
        setFeed(data.feed);
        setCurrentUsername(data.current_username);
      }
      setLoading(false);
    }
    load();
  }, []);

  const empty = (
    <div className="border border-[#222] p-8 text-center">
      <p className="text-[#888] text-sm mb-4">Nothing here yet. Add friends or log a movie.</p>
      <div className="flex gap-3 justify-center">
        <Link href="/friends" className="text-sm px-4 py-2 border border-[#222] text-[#888] hover:text-white hover:border-[#888] transition-colors">
          Find friends →
        </Link>
      </div>
    </div>
  );

  const byUser = feed.reduce<Record<string, FeedItem[]>>((acc, item) => {
    if (!acc[item.username]) acc[item.username] = [];
    acc[item.username].push(item);
    return acc;
  }, {});
  const users = Object.keys(byUser);

  const myWatchedTitles = new Set(
    (currentUsername ? byUser[currentUsername] ?? [] : [])
      .filter((i) => i.action === "watched")
      .map((i) => i.movie_title)
  );
  const friendUsers = currentUsername ? users.filter((u) => u !== currentUsername) : users;
  const friendWatchedTitles = new Set(
    friendUsers.flatMap((u) =>
      byUser[u].filter((i) => i.action === "watched").map((i) => i.movie_title)
    )
  );
  const sharedTitles = new Set(
    [...myWatchedTitles].filter((t) => friendWatchedTitles.has(t))
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Friends Feed</h1>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[#111] border border-[#222] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && feed.length === 0 && empty}

      {/* List view */}
      {!loading && feed.length > 0 && view === "list" && (
        <ul className="space-y-2">
          {feed.map((item) => (
            <li key={item.id} className="border border-[#222] bg-[#111] hover:border-[#333] transition-colors">
              {/* Clickable main row */}
              <div className="flex h-32 cursor-pointer" onClick={() => setViewing(feedItemToEntry(item))}>
                <div className="w-24 shrink-0 overflow-hidden">
                  {item.movie_poster_url ? (
                    <img src={item.movie_poster_url} alt={item.movie_title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
                      <span className="text-[#222] text-2xl">▶</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between px-4 py-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="tag-chip text-[8px] text-[#666] bg-[#181818] px-1.5 py-0.5 leading-none shrink-0">
                        {item.action === "watched" ? "Watched" : "Want to Watch"}
                      </span>
                      <Link href={`/profile/${item.username}`} className="text-[9px] text-[#555] hover:text-white transition-colors truncate" onClick={(e) => e.stopPropagation()}>
                        {item.username}
                      </Link>
                    </div>
                    <p className="font-bold text-xl leading-snug line-clamp-2">{item.movie_title}</p>
                    <p className="text-[10px] text-[#555] mt-0.5">
                      {[item.movie_director, item.movie_year].filter(Boolean).join("  ·  ")}
                    </p>
                  </div>
                  {item.rating !== null && <StarDisplay value={item.rating} size="sm" />}
                </div>
              </div>
              {/* Comment strip */}
              <CommentToggle entryId={item.id} className="border-t border-[#1a1a1a] px-4 py-2" />
            </li>
          ))}
        </ul>
      )}

      {/* Card view */}
      {!loading && feed.length > 0 && view === "card" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {feed.map((item) => (
            <div key={item.id} className="flex flex-col bg-[#111] border border-[#222]">
              {/* Clickable poster + info */}
              <div className="cursor-pointer" onClick={() => setViewing(feedItemToEntry(item))}>
                <div className="aspect-[3/4] bg-[#0a0a0a] overflow-hidden">
                  {item.movie_poster_url ? (
                    <img src={item.movie_poster_url} alt={item.movie_title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#222] text-2xl">▶</div>
                  )}
                </div>
                <div className="px-2.5 py-2 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="tag-chip text-[8px] text-[#666] bg-[#181818] px-1.5 py-0.5 leading-none tracking-wide">
                      {item.action === "watched" ? "Watched" : "Want to Watch"}
                    </span>
                    <Link href={`/profile/${item.username}`} className="text-[8px] text-[#555] hover:text-white transition-colors truncate" onClick={(e) => e.stopPropagation()}>
                      {item.username}
                    </Link>
                  </div>
                  <p className="text-xs font-semibold leading-snug line-clamp-2">{item.movie_title}</p>
                  <p className="text-[8px] text-[#555] leading-tight">
                    {[item.movie_director, item.movie_year].filter(Boolean).join("  ·  ")}
                  </p>
                  {item.rating !== null && <StarDisplay value={item.rating} size="sm" />}
                </div>
              </div>
              {/* Comment strip */}
              <CommentToggle entryId={item.id} className="border-t border-[#1a1a1a] px-2.5 py-1.5 mt-auto" />
            </div>
          ))}
        </div>
      )}

      {/* Venn view */}
      {!loading && feed.length > 0 && view === "venn" && (
        <div>
          {sharedTitles.size > 0 && (
            <div className="mb-8 border border-[#222] bg-[#111] p-4">
              <p className="text-xs text-[#888] uppercase tracking-widest mb-3">Both you and a friend watched</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(sharedTitles).map((title) => (
                  <span key={title} className="text-xs px-2 py-1 bg-white/10 border border-white/20 text-white">
                    {title}
                  </span>
                ))}
              </div>
            </div>
          )}
          {sharedTitles.size === 0 && myWatchedTitles.size > 0 && (
            <div className="mb-8 border border-[#222] bg-[#111] p-4">
              <p className="text-xs text-[#555]">No movies in common with your friends yet.</p>
            </div>
          )}
          <div className="flex justify-center mb-8 select-none overflow-x-auto">
            <div className="flex items-center" style={{ minWidth: users.length * 140 }}>
              {users.map((username, i) => {
                const userItems = byUser[username];
                const watched = userItems.filter((x) => x.action === "watched");
                const isMe = username === currentUsername;
                const colors = ["border-white/30 bg-white/5", "border-[#6366f1]/40 bg-[#6366f1]/5", "border-emerald-500/40 bg-emerald-500/5", "border-rose-500/40 bg-rose-500/5"];
                return (
                  <div
                    key={username}
                    className={`rounded-full border-2 ${colors[i % colors.length]} flex flex-col items-center justify-center text-center shrink-0`}
                    style={{ width: 160, height: 160, marginLeft: i > 0 ? -40 : 0, zIndex: i }}
                  >
                    <Link href={`/profile/${username}`} className="text-xs font-medium hover:underline px-4 truncate max-w-full">
                      {isMe ? "you" : username}
                    </Link>
                    <p className="text-xl font-semibold mt-1">{watched.length}</p>
                    <p className="text-[10px] text-[#888]">watched</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={`grid gap-6 ${users.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
            {users.map((username) => {
              const isMe = username === currentUsername;
              return (
                <div key={username}>
                  <Link href={`/profile/${username}`} className="text-xs text-[#888] uppercase tracking-widest mb-3 block hover:text-white transition-colors">
                    {isMe ? "you" : username}
                  </Link>
                  <ul className="space-y-1.5">
                    {byUser[username].slice(0, 8).map((item) => (
                      <li key={item.id} className="text-sm flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.action === "watched" ? "bg-white" : "bg-[#6366f1]"}`} />
                        <span className={`truncate ${sharedTitles.has(item.movie_title) ? "text-white font-medium" : "text-[#aaa]"}`}>
                          {item.movie_title}
                        </span>
                      </li>
                    ))}
                    {byUser[username].length > 8 && (
                      <li className="text-xs text-[#555]">+{byUser[username].length - 8} more</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View entry modal — read-only */}
      {viewing && (
        <WatchlistModal
          isOpen
          onClose={() => setViewing(null)}
          existing={viewing}
          onSave={async () => {}}
          readOnly
        />
      )}
    </div>
  );
}

function feedItemToEntry(item: FeedItem): WatchlistEntry {
  return {
    id: item.id,
    user_id: "",
    movie_id: "",
    status: item.action,
    rating: item.rating,
    review: item.review,
    watched_at: item.watched_at,
    created_at: item.created_at,
    movie: {
      id: "",
      user_id: "",
      title: item.movie_title,
      year: item.movie_year,
      genre: item.movie_genre,
      director: item.movie_director,
      poster_url: item.movie_poster_url,
      created_at: item.created_at,
    },
  };
}
