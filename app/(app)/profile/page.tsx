"use client";

import { useEffect, useRef, useState } from "react";
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
  const [taken, setTaken] = useState(false);
  const [checking, setChecking] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function handleUsernameChange(val: string) {
    const v = val.toLowerCase();
    setUsername(v);
    setTaken(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v || v === profile?.username) return;
    debounceRef.current = setTimeout(async () => {
      setChecking(true);
      const res = await fetch(`/api/users/${encodeURIComponent(v)}`);
      setChecking(false);
      if (res.ok) setTaken(true); // username exists (belongs to someone else)
    }, 400);
  }

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
    if (taken) { setErrors({ username: "Username is already taken." }); return; }
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
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="your name"
            autoFocus
          />
          {taken && !checking && (
            <p className="text-xs text-red-400 mt-1">Username is already taken.</p>
          )}
          {checking && (
            <p className="text-xs text-[#555] mt-1">Checking...</p>
          )}
          {!taken && !checking && errors.username && (
            <p className="text-xs text-red-400 mt-1">{errors.username}</p>
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
