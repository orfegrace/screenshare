"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import type { Message, Conversation } from "@/lib/types";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(
    searchParams.get("with")
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  async function fetchConversations() {
    const res = await fetch("/api/messages");
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    }
    setLoadingConvos(false);
  }

  async function fetchMessages(friendId: string) {
    setLoadingMessages(true);
    const res = await fetch(`/api/messages/${friendId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
    setLoadingMessages(false);
  }

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeConvo) return;
    fetchMessages(activeConvo);
    const interval = setInterval(() => fetchMessages(activeConvo), 5000);
    return () => clearInterval(interval);
  }, [activeConvo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo) return;
    setSending(true);

    const res = await fetch(`/api/messages/${activeConvo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage.trim() }),
    });

    setSending(false);
    if (res.ok) {
      setNewMessage("");
      fetchMessages(activeConvo);
      fetchConversations();
    } else {
      showToast("Failed to send message.", "error");
    }
  }

  const activeConvoData = conversations.find((c) => c.friend_id === activeConvo);

  return (
    <div className="h-[calc(100vh-0px)] md:h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside
        className={`${
          activeConvo ? "hidden md:flex" : "flex"
        } md:flex flex-col w-full md:w-64 border-r border-[#222] shrink-0`}
      >
        <div className="px-4 py-4 border-b border-[#222]">
          <h1 className="text-base font-semibold tracking-tight">Messages</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-[#111] border border-[#222] animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs text-[#888]">No conversations yet.</p>
              <p className="text-xs text-[#555] mt-1">
                Visit a friend&apos;s profile to start chatting.
              </p>
            </div>
          ) : (
            <ul>
              {conversations.map((convo) => (
                <li key={convo.friend_id}>
                  <button
                    onClick={() => setActiveConvo(convo.friend_id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-[#111] hover:bg-[#111] transition-colors ${
                      activeConvo === convo.friend_id ? "bg-[#111]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{convo.username}</span>
                      {convo.unread_count > 0 && (
                        <span className="bg-white text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>
                    {convo.last_message && (
                      <p className="text-xs text-[#888] mt-0.5 truncate">
                        {convo.last_message}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Message thread */}
      <div
        className={`${
          activeConvo ? "flex" : "hidden md:flex"
        } flex-1 flex flex-col`}
      >
        {!activeConvo ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[#888] text-sm">Select a conversation</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-4 border-b border-[#222] flex items-center gap-3">
              <button
                onClick={() => setActiveConvo(null)}
                className="md:hidden text-[#888] hover:text-white transition-colors text-lg"
              >
                ←
              </button>
              <span className="text-sm font-medium">
                {activeConvoData?.username ?? ""}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-10 bg-[#111] border border-[#222] animate-pulse max-w-[60%] ${
                        i % 2 === 0 ? "ml-auto" : ""
                      }`}
                    />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#888] text-sm">
                    No messages yet. Say hello!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-3 py-2 text-sm ${
                          isMine
                            ? "bg-white text-black"
                            : "bg-[#111] border border-[#222] text-white"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isMine ? "text-[#666]" : "text-[#555]"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={sendMessage}
              className="p-4 border-t border-[#222] flex gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Send a message..."
                className="flex-1"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-4 py-2 bg-white text-black text-sm hover:bg-[#ddd] disabled:opacity-50 transition-colors shrink-0"
              >
                {sending ? "..." : "Send"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
