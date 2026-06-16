"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import type { Profile } from "@/lib/types";

interface Stats {
  watched: number;
  wantToWatch: number;
  avgRating: number | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ watched: 0, wantToWatch: 0, avgRating: null });
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setStats(data.stats);
        setUsername(data.profile.username);
        setBio(data.profile.bio ?? "");
      }
      setLoading(false);
    }
    load();
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = "Username is required.";
    else if (username.length < 3) e.username = "Must be at least 3 characters.";
    else if (!/^[a-z0-9_]+$/.test(username)) e.username = "Only lowercase letters, numbers, underscores.";
    return e;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, bio }),
    });

    setSaving(false);
    if (res.ok) {
      showToast("Profile updated.", "success");
    } else {
      const body = await res.json();
      showToast(body.error ?? "Failed to update profile.", "error");
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="h-8 w-32 bg-[#111] border border-[#222] animate-pulse mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-[#111] border border-[#222] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight mb-8">Profile</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 border border-[#222] mb-8">
        <div className="p-4 border-r border-[#222] text-center">
          <p className="text-2xl font-semibold">{stats.watched}</p>
          <p className="text-xs text-[#888] mt-1">Watched</p>
        </div>
        <div className="p-4 border-r border-[#222] text-center">
          <p className="text-2xl font-semibold">{stats.wantToWatch}</p>
          <p className="text-xs text-[#888] mt-1">Want to Watch</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-2xl font-semibold">
            {stats.avgRating !== null ? stats.avgRating.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-[#888] mt-1">Avg Rating</p>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs text-[#888] mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="your name"
          />
          {errors.username && (
            <p className="text-xs text-white mt-1">{errors.username}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-[#888] mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a bit about yourself..."
            rows={3}
            className="resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="py-2.5 bg-white text-black text-sm font-medium hover:bg-[#ddd] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="mt-10 pt-6 border-t border-[#222]">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-sm text-[#888] hover:text-white transition-colors disabled:opacity-50"
        >
          {loggingOut ? "Signing out..." : "Sign out →"}
        </button>
      </div>
    </div>
  );
}
