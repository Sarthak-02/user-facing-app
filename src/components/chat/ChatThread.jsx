import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, SendHorizontal } from "lucide-react";
import { Card, Button } from "../../ui-components";
import Loader from "../../ui-components/Loader";
import { useAuth } from "../../store/auth.store";
import {
  listMessages,
  sendChatMessage,
  markConversationRead,
  getConversation,
} from "../../api/chat.api";
import {
  conversationTitle,
  isMessageFromCurrentUser,
  messageBody,
  messageCreatedAt,
  messageId,
  messageTimeLabel,
} from "./chatUtils";

const POLL_MS = 4000;

function sortChrono(msgs) {
  return [...msgs].sort(
    (a, b) =>
      new Date(messageCreatedAt(a)).getTime() -
      new Date(messageCreatedAt(b)).getTime()
  );
}

function mergeMessages(prev, incoming) {
  const map = new Map();
  for (const m of prev) {
    const id = messageId(m);
    if (id) map.set(id, m);
    else map.set(`${messageCreatedAt(m)}-${messageBody(m)}`, m);
  }
  for (const m of incoming) {
    const id = messageId(m);
    if (id) {
      if (!map.has(id)) map.set(id, m);
    } else {
      const k = `${messageCreatedAt(m)}-${messageBody(m)}`;
      if (!map.has(k)) map.set(k, m);
    }
  }
  return sortChrono([...map.values()]);
}

function latestCreatedAtIso(msgs) {
  let max = "";
  for (const m of msgs) {
    const iso = messageCreatedAt(m);
    if (!iso) continue;
    if (!max || new Date(iso) > new Date(max)) max = iso;
  }
  return max;
}

/**
 * @param {{ conversationId: string, backTo: string }} props
 */
export default function ChatThread({ conversationId, backTo }) {
  const { auth } = useAuth();
  const currentUserId = String(auth?.userId ?? "").trim();

  const [title, setTitle] = useState("Chat");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const pollAfterRef = useRef("");

  const scrollToBottom = useCallback(() => {
    const area = scrollAreaRef.current;
    if (area) {
      area.scrollTo({ top: area.scrollHeight, behavior: "smooth" });
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadInitial = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const [conv, msgs] = await Promise.all([
        getConversation(conversationId).catch(() => null),
        listMessages(conversationId, { limit: 80 }),
      ]);
      if (conv) {
        setTitle(conversationTitle(conv, currentUserId));
      }
      const sorted = sortChrono(msgs);
      setMessages(sorted);
      pollAfterRef.current = latestCreatedAtIso(sorted);
      await markConversationRead(conversationId).catch(() => {});
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Could not load messages.";
      setError(typeof msg === "string" ? msg : "Could not load messages.");
    } finally {
      setLoading(false);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!conversationId || loading) return;
    markConversationRead(conversationId).catch(() => {});
  }, [conversationId, loading]);

  useEffect(() => {
    if (!conversationId || loading) return;

    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const after = pollAfterRef.current;
      try {
        const next = after
          ? await listMessages(conversationId, { after, limit: 200 })
          : await listMessages(conversationId, { limit: 80 });
        if (cancelled || !next.length) return;
        setMessages((prev) => {
          const merged = mergeMessages(prev, next);
          const newest = latestCreatedAtIso(merged);
          if (newest) pollAfterRef.current = newest;
          return merged;
        });
      } catch {
        /* ignore transient poll errors */
      }
    };

    const id = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [conversationId, loading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const onSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !conversationId || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await sendChatMessage(conversationId, text);
      setDraft("");
      if (created && typeof created === "object") {
        const outgoing = isMessageFromCurrentUser(created, currentUserId)
          ? created
          : { ...created, fromMe: true };
        setMessages((prev) => mergeMessages(prev, [outgoing]));
        const iso = messageCreatedAt(created);
        if (iso && new Date(iso) >= new Date(pollAfterRef.current || 0)) {
          pollAfterRef.current = iso;
        }
      } else {
        const msgs = await listMessages(conversationId, { limit: 80 });
        const sorted = sortChrono(msgs);
        setMessages(sorted);
        pollAfterRef.current = latestCreatedAtIso(sorted);
      }
      await markConversationRead(conversationId).catch(() => {});
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to send.";
      setError(typeof msg === "string" ? msg : "Failed to send.");
    } finally {
      setSending(false);
    }
  };

  const rows = useMemo(() => messages, [messages]);

  if (!conversationId) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--color-background)]">
      <header className="shrink-0 border-b border-gray-100 bg-white px-3 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <Link
            to={backTo}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            aria-label="Back to conversations"
          >
            <ChevronLeft size={22} />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-base font-bold text-gray-950 dark:text-gray-100">
            {title}
          </h1>
        </div>
      </header>

      <div
        ref={scrollAreaRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4"
      >
        <div className="mx-auto max-w-3xl space-y-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader />
            </div>
          ) : null}

          {error ? (
            <Card className="border border-error-200 bg-error-50/80 p-4 dark:border-error-900 dark:bg-error-950/40">
              <p className="text-sm font-semibold text-error-800 dark:text-error-200">
                {error}
              </p>
            </Card>
          ) : null}

          {!loading &&
            rows.map((m) => {
              const sentByMe = isMessageFromCurrentUser(m, currentUserId);
              const body = messageBody(m);
              const when = messageTimeLabel(messageCreatedAt(m));
              return (
                <div
                  key={messageId(m) || `${when}-${body.slice(0, 12)}`}
                  className={`flex w-full ${sentByMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                      sentByMe
                        ? "rounded-br-md bg-primary-600 text-white"
                        : "rounded-bl-md border border-gray-100 bg-white text-gray-950 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-left leading-relaxed">
                      {body}
                    </p>
                    <p
                      className={`mt-1 text-left text-[10px] font-semibold uppercase tracking-wide ${
                        sentByMe ? "text-primary-100" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {when}
                    </p>
                  </div>
                </div>
              );
            })}
          <div ref={bottomRef} />
        </div>
      </div>

      <footer className="shrink-0 border-t border-gray-100 bg-white p-3 pb-24 dark:border-gray-800 dark:bg-gray-900 md:pb-3">
        <form
          onSubmit={onSend}
          className="mx-auto flex max-w-3xl gap-2"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a message…"
            rows={1}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-950 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            disabled={sending || loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={sending || loading || !draft.trim()}
            className="h-11 shrink-0 self-end px-4"
          >
            {sending ? (
              <span className="text-xs">…</span>
            ) : (
              <SendHorizontal size={18} />
            )}
          </Button>
        </form>
      </footer>
    </div>
  );
}
