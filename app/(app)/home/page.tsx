"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StarDisplay } from "@/components/StarRating";
import type { FeedItem } from "@/lib/types";

export default function HomePage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/feed");
      if (res.ok) {
        const data = await res.json();
        setFeed(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Feed</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[#111] border border-[#222] animate-pulse" />
          ))}
        </div>
      ) : feed.length === 0 ? (
        <div className="border border-[#222] p-8 text-center">
          <p className="text-[#888] text-sm mb-4">
            Nothing here yet. Add friends or log a movie.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/movies/add"
              className="text-sm px-4 py-2 bg-white text-black hover:bg-[#ddd] transition-colors"
            >
              Add a movie →
            </Link>
            <Link
              href="/friends"
              className="text-sm px-4 py-2 border border-[#222] text-[#888] hover:text-white hover:border-[#888] transition-colors"
            >
              Find friends →
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-px">
          {feed.map((item) => (
            <li
              key={item.id}
              className="border border-[#222] p-4 bg-[#111] hover:bg-[#161616] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-sm">
                    <Link
                      href={`/profile/${item.username}`}
                      className="font-medium hover:underline"
                    >
                      {item.username}
                    </Link>
                    <span className="text-[#888]">
                      {item.action === "watched" ? "watched" : "wants to watch"}
                    </span>
                    <span className="font-medium">
                      {item.movie_title}
                      {item.movie_year && (
                        <span className="text-[#888] font-normal ml-1">
                          ({item.movie_year})
                        </span>
                      )}
                    </span>
                  </div>

                  {item.action === "watched" && (
                    <div className="mt-1.5 flex items-center gap-3">
                      {item.rating !== null && (
                        <StarDisplay value={item.rating} size="sm" />
                      )}
                      {item.review && (
                        <p className="text-[#888] text-xs truncate max-w-xs">
                          {item.review}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <time className="text-xs text-[#555] shrink-0">
                  {new Date(item.created_at).toLocaleDateString("en-US", {
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
  );
}
