"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WatchlistModal } from "@/components/WatchlistModal";
import { useToast } from "@/components/Toast";
import type { EntryData } from "@/components/WatchlistModal";

export default function AddMoviePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [newMovieId, setNewMovieId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Movie title is required.";
    if (year && (isNaN(Number(year)) || Number(year) < 1888 || Number(year) > 2100))
      e.year = "Enter a valid year.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const res = await fetch("/api/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        year: year ? Number(year) : null,
        poster_url: posterUrl.trim() || null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json();
      showToast(body.error ?? "Failed to add movie.", "error");
      return;
    }

    const movie = await res.json();
    setNewMovieId(movie.id);
    setShowModal(true);
  }

  async function handleWatchlistSave(data: EntryData) {
    if (!newMovieId) return;

    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie_id: newMovieId, status: data.status, rating: data.rating, review: data.review }),
    });

    if (res.ok) {
      showToast("Movie added to your list!", "success");
      setShowModal(false);
      router.push("/movies");
    } else {
      const body = await res.json();
      showToast(body.error ?? "Failed to add to watchlist.", "error");
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight mb-8">Add a Movie</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs text-[#888] mb-1.5">
            Movie Title <span className="text-white">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Parasite"
          />
          {errors.title && (
            <p className="text-xs text-white mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-[#888] mb-1.5">
            Year <span className="text-[#555]">(optional)</span>
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2019"
            min="1888"
            max="2100"
          />
          {errors.year && (
            <p className="text-xs text-white mt-1">{errors.year}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-[#888] mb-1.5">
            Poster Image URL <span className="text-[#555]">(optional)</span>
          </label>
          <input
            type="url"
            value={posterUrl}
            onChange={(e) => setPosterUrl(e.target.value)}
            placeholder="https://..."
          />
          {posterUrl && (
            <div className="mt-2 w-20 h-28 overflow-hidden border border-[#333]">
              <img
                src={posterUrl}
                alt="Poster preview"
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="py-2.5 bg-white text-black text-sm font-medium hover:bg-[#ddd] disabled:opacity-50 transition-colors"
        >
          {loading ? "Adding..." : "Add movie →"}
        </button>
      </form>

      {newMovieId && showModal && (
        <WatchlistModal
          isOpen
          onClose={() => {
            setShowModal(false);
            router.push("/movies");
          }}
          onSave={handleWatchlistSave}
        />
      )}
    </div>
  );
}
