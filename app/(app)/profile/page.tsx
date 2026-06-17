"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile ?? null);
        setUsername(data.profile?.username ?? "");
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
      body: JSON.stringify({ username }),
    });

    setSaving(false);
    if (res.ok) {
      showToast("Username updated.", "success");
      setProfile((p) => p ? { ...p, username } : p);
      window.dispatchEvent(new CustomEvent("username-updated", { detail: { username } }));
    } else {
      const body = await res.json();
      showToast(body.error ?? "Failed to update.", "error");
    }
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
    <div className="max-w-sm mx-auto px-6 py-10">
      <button
        onClick={() => router.back()}
        className="text-xs text-[#888] hover:text-white transition-colors mb-6 block"
      >
        ← Back
      </button>
      <h1 className="text-xl font-semibold tracking-tight mb-8">Edit Username</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs text-[#888] mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="your name"
            autoFocus
          />
          {errors.username && (
            <p className="text-xs text-white mt-1">{errors.username}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="py-2.5 bg-white text-black text-sm font-medium hover:bg-[#ddd] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
