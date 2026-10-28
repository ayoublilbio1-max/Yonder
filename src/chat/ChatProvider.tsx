import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSwipe } from "../deck/SwipeProvider";
import { withOverrides } from "../filters/filters";
import { profileById } from "../profiles/data";
import { isLocked } from "../profiles/extras";
import type { Profile } from "../profiles/types";
import { openerFor, replyFor, writesFirst } from "./replies";

// Chats with your matches, saved on the phone per account (demo: the other side is simulated).
// - About half of the matches write first, a few seconds after the match.
// - They "type" and reply to every message you send.
// - Locked profiles (rule 9.3) share their photos after you've sent 3 messages, or a few seconds
//   after you tap "Request photos". Once shared, they stay shared.
// Mount it inside SwipeProvider (it reads your matches and compliments).

export type ChatMessage = {
  id: string;
  from: "me" | "them" | "system";
  text: string;
  at: number; // ms
};

export type ChatThread = {
  messages: ChatMessage[]; // oldest first
  unread: number;
  revealed: boolean; // locked photos shared with you
  requested: boolean; // you tapped "Request photos"
  replies: number; // how many times they replied (picks the next reply)
  sent: number; // how many messages you sent
};

const NEW_THREAD: ChatThread = {
  messages: [],
  unread: 0,
  revealed: false,
  requested: false,
  replies: 0,
  sent: 0,
};
const AUTO_REVEAL_AFTER = 3; // your messages before a locked profile shares photos
const chatsKey = (userId: string) => `yonder.chats.${userId}`;
let msgSeq = 0;
const newId = () => `${Date.now().toString(36)}-${(msgSeq++).toString(36)}`;

type ChatContextValue = {
  ready: boolean;
  threads: Record<string, ChatThread>;
  typing: Record<string, boolean>;
  profileFor: (id: string) => Profile | null; // with rule 9.4 details, unblurred once shared
  send: (id: string, text: string) => void;
  requestPhotos: (id: string) => void;
  setActive: (id: string | null) => void; // the chat on screen (its messages don't count as unread)
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const { ready: swipeReady, saved, me } = useSwipe();
  const [ready, setReady] = useState(false);
  const [threads, setThreads] = useState<Record<string, ChatThread>>({});
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const activeRef = useRef<string | null>(null);
  const threadsRef = useRef(threads); // latest chats, for replies that arrive later
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const scheduled = useRef(new Set<string>()); // openers already planned this session

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(chatsKey(userId))
      .then((raw) => {
        if (!alive) return;
        const loaded = raw
          ? (JSON.parse(raw) as Record<string, ChatThread>)
          : {};
        setThreads(loaded);
        if (__DEV__)
          console.log(`[chat] loaded · ${Object.keys(loaded).length} chats`);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(chatsKey(userId), JSON.stringify(threads)).catch(
      () => {},
    );
  }, [threads, ready, userId]);

  useEffect(() => {
    const all = timers.current;
    return () => all.forEach(clearTimeout);
  }, []);

  const later = useCallback((ms: number, fn: () => void) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);

  const profileFor = useCallback(
    (id: string) => {
      const base = profileById(id);
      if (!base) return null;
      const p = withOverrides(base);
      return threads[id]?.revealed ? { ...p, blurred: false } : p;
    },
    [threads],
  );

  // Add a message to a chat (creates the chat if needed).
  const push = useCallback(
    (
      id: string,
      from: ChatMessage["from"],
      text: string,
      patch?: (t: ChatThread) => Partial<ChatThread>,
    ) => {
      setThreads((prev) => {
        const t = prev[id] ?? NEW_THREAD;
        const incoming = from === "them" && activeRef.current !== id;
        return {
          ...prev,
          [id]: {
            ...t,
            ...patch?.(t),
            messages: [
              ...t.messages,
              { id: newId(), from, text, at: Date.now() },
            ],
            unread: incoming ? t.unread + 1 : t.unread,
          },
        };
      });
    },
    [],
  );

  const reveal = useCallback(
    (id: string) => {
      const p = profileById(id);
      if (!p || threadsRef.current[id]?.revealed) return; // shared only once
      const her = p.gender === "male" ? "his" : "her";
      push(id, "system", `${p.name} shared ${her} photos with you 🔓`, () => ({
        revealed: true,
      }));
      if (__DEV__) console.log(`[chat] ${id} photos shared`);
    },
    [push],
  );

  // New matches: start their chat (with your compliment, if you sent one) and maybe an opener from them.
  useEffect(() => {
    if (!ready || !swipeReady) return;
    Object.entries(saved.matches).forEach(([id, at]) => {
      if (threads[id] || scheduled.current.has(id)) return;
      scheduled.current.add(id);
      const p = profileById(id);
      if (!p) return;
      const compliment = saved.compliments[id];
      later(0, () =>
        setThreads((prev) =>
          prev[id]
            ? prev
            : {
                ...prev,
                [id]: {
                  ...NEW_THREAD,
                  messages: compliment
                    ? [{ id: newId(), from: "me", text: compliment, at }]
                    : [],
                  sent: compliment ? 1 : 0,
                },
              },
        ),
      );
      if (writesFirst(p)) {
        const recent = Date.now() - at < 60_000;
        later(recent ? 6000 : 300, () =>
          push(id, "them", openerFor(p, me.firstName)),
        );
        if (__DEV__) console.log(`[chat] ${id} will write first`);
      }
    });
  }, [
    ready,
    swipeReady,
    saved.matches,
    saved.compliments,
    threads,
    later,
    push,
    me.firstName,
  ]);

  const send = useCallback(
    (id: string, text: string) => {
      const p = profileById(id);
      const clean = text.trim();
      if (!p || !clean) return;
      push(id, "me", clean, (t) => ({ sent: t.sent + 1 }));
      if (__DEV__) console.log(`[chat] → ${id} (${clean.length} chars)`);

      const wait = 1800 + Math.round(Math.random() * 1600); // they read, then type
      later(700, () => setTyping((prev) => ({ ...prev, [id]: true })));
      later(700 + wait, () => {
        const cur = threadsRef.current[id] ?? NEW_THREAD;
        const reply = replyFor(p, cur.replies, clean, me.firstName);
        setTyping((prev) => ({ ...prev, [id]: false }));
        push(id, "them", reply, (t) => ({ replies: t.replies + 1 }));
        if (__DEV__) console.log(`[chat] ← ${id} reply #${cur.replies + 1}`);
        if (isLocked(p) && !cur.revealed && cur.sent >= AUTO_REVEAL_AFTER)
          later(1500, () => reveal(id));
      });
    },
    [push, later, reveal, me.firstName],
  );

  const requestPhotos = useCallback(
    (id: string) => {
      const p = profileById(id);
      const t = threadsRef.current[id];
      if (!p || t?.revealed || t?.requested) return;
      const her = p.gender === "male" ? "his" : "her";
      push(id, "system", `You asked ${p.name} to share ${her} photos`, () => ({
        requested: true,
      }));
      later(4000, () => reveal(id));
      if (__DEV__) console.log(`[chat] ${id} photos requested`);
    },
    [push, later, reveal],
  );

  const setActive = useCallback((id: string | null) => {
    activeRef.current = id;
    if (id)
      setThreads((prev) =>
        prev[id]?.unread ? { ...prev, [id]: { ...prev[id], unread: 0 } } : prev,
      );
  }, []);

  const value = useMemo(
    () => ({
      ready,
      threads,
      typing,
      profileFor,
      send,
      requestPhotos,
      setActive,
    }),
    [ready, threads, typing, profileFor, send, requestPhotos, setActive],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChats() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChats must be used inside ChatProvider");
  return ctx;
}

// "14:02" today · "Yesterday" · "12 Oct"
export function chatTime(at: number) {
  const d = new Date(at);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
