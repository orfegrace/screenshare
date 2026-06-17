"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { createClient } from "@/lib/supabase";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (profile?.username) setUsername(profile.username);
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);
      setUnread(count ?? 0);
    }

    init();

    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      setLight(true);
      document.documentElement.classList.add("light");
    }

    const interval = setInterval(async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { count } = await sb
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);
      setUnread(count ?? 0);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleUsernameUpdate(e: Event) {
      const detail = (e as CustomEvent<{ username: string }>).detail;
      if (detail?.username) setUsername(detail.username);
    }
    window.addEventListener("username-updated", handleUsernameUpdate);
    return () => window.removeEventListener("username-updated", handleUsernameUpdate);
  }, []);

  function toggleTheme() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("theme", next ? "light" : "dark");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const links = [
    { href: "/movies", label: "My List" },
    { href: "/friends", label: "Add Friends" },
    { href: "/home", label: "Friends Feed" },
  ];

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 h-14 bg-black border-b border-[#222] flex items-center px-6 z-40">
      <Link
        href="/movies"
        className="text-base font-bold tracking-tight mr-8 shrink-0 hover:opacity-80 transition-opacity"
      >
        ScreenShare
      </Link>

      <div className="flex items-center gap-1 flex-1">
        {links.map(({ href, label }) => {
          const isActive =
            href === "/home" ? pathname === "/home" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 text-sm transition-colors rounded-sm ${
                isActive ? "text-white" : "text-[#888] hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {/* Profile circle + username */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity relative"
          >
            {username && (
              <span className="text-sm text-[#ccc]">{username}</span>
            )}
            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center relative overflow-hidden shrink-0">
              <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                <circle cx="16" cy="32" r="11" fill="#444" />
                <circle cx="16" cy="13" r="6" fill="#444" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
          </button>

          {open && (
            <div className="absolute right-0 top-11 w-44 bg-[#111] border border-[#222] py-1 shadow-xl">
              <Link
                href="/messages"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-sm text-[#ccc] hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" />
                  </svg>
                  Messages
                  {unread > 0 && (
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </span>
                {unread > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#ccc] hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit username
              </Link>
              <div className="border-t border-[#222] my-1" />
              <button
                onClick={signOut}
                className="w-full text-left px-4 py-2.5 text-sm text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>

      {/* Theme toggle — fixed bottom right */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-5 right-5 z-50 w-9 h-9 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-[#888] hover:text-white hover:border-white transition-colors shadow-lg"
        title={light ? "Switch to dark" : "Switch to light"}
      >
        {light ? <Moon size={15} /> : <Sun size={15} />}
      </button>
    </>
  );
}
