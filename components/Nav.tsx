"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: "/home", label: "Home", icon: "⌂" },
  { href: "/movies", label: "My List", icon: "◫" },
  { href: "/movies/add", label: "Add Movie", icon: "+" },
  { href: "/friends", label: "Friends", icon: "◎" },
  { href: "/messages", label: "Messages", icon: "◻" },
  { href: "/profile", label: "Profile", icon: "○" },
];

export function Nav() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function fetchUnread() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);
      setUnread(count ?? 0);
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-52 border-r border-[#222] flex-col py-8 px-6 z-40 bg-black">
        <div className="mb-10">
          <span className="text-lg font-semibold tracking-tight">ScreenShare</span>
        </div>
        <ul className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/home"
                ? pathname === "/home"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors relative ${
                    isActive
                      ? "bg-white text-black"
                      : "text-[#888] hover:text-white hover:bg-[#111]"
                  }`}
                >
                  <span className="text-base w-4 text-center">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.label === "Messages" && unread > 0 && (
                    <span className="ml-auto bg-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#222] bg-black z-40 flex">
        {navItems.map((item) => {
          const isActive =
            item.href === "/home"
              ? pathname === "/home"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 text-xs gap-1 transition-colors relative ${
                isActive ? "text-white" : "text-[#666] hover:text-white"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="hidden xs:block">{item.label}</span>
              {item.label === "Messages" && unread > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-12px)] bg-white text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
