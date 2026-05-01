import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCirclePlus, ChevronRight, Search, X } from "lucide-react";
import { Button } from "../../ui-components";
import Loader from "../../ui-components/Loader";
import { useAuth } from "../../store/auth.store";
import { usePermissions } from "../../store/permissions.store";
import { listTeachersBySection } from "../../api/teacher.api";
import {
  listConversations,
  createDirectConversation,
  pickConversationId,
} from "../../api/chat.api";
import {
  conversationId,
  conversationLastMessage,
  conversationTitle,
  conversationUnreadCount,
  conversationUpdatedAt,
  relativeTimeLabel,
} from "./chatUtils";
import { useTranslation } from "react-i18next";

function getInitials(name) {
  return (
    String(name || "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?"
  );
}

function Avatar({ name }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
      {getInitials(name)}
    </div>
  );
}


/**
 * @param {{ mode: 'student' | 'staff', threadBase: string, activeId?: string }} props
 */
export default function ChatInbox({ mode, threadBase, activeId = "" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const currentUserId = String(auth?.userId ?? "").trim();
  const { permissions } = usePermissions();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [creatingId, setCreatingId] = useState("");
  const [manualId, setManualId] = useState("");

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listConversations();
      const sorted = [...list].sort(
        (a, b) =>
          new Date(conversationUpdatedAt(b) || 0).getTime() -
          new Date(conversationUpdatedAt(a) || 0).getTime()
      );
      setConversations(sorted);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Could not load conversations.";
      setError(typeof msg === "string" ? msg : "Could not load conversations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const campusId = auth.campus_id;
    const sectionId = auth.sections?.[0]?.value;
    if (mode !== "student" || !campusId || !sectionId) return;
    let cancelled = false;
    (async () => {
      setContactsLoading(true);
      try {
        const list = await listTeachersBySection(campusId, sectionId);
        if (!cancelled) {
          setContacts(
            list.map((t) => ({
              userId: String(t.teacher_id ?? t.id ?? "").trim(),
              name: [t.teacher_first_name, t.teacher_middle_name, t.teacher_last_name]
                .filter(Boolean)
                .join(" ") || "Teacher",
            })).filter((t) => t.userId)
          );
        }
      } catch {
        if (!cancelled) setContacts([]);
      } finally {
        if (!cancelled) setContactsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, auth.campus_id, auth.sections]);

  const staffStudents = useMemo(() => {
    if (mode !== "staff") return [];
    const seen = new Map();
    for (const s of permissions.students || []) {
      const id = String(s.student_id ?? "").trim();
      if (!id || seen.has(id)) continue;
      seen.set(id, String(s.student_name || "Student").trim() || "Student");
    }
    return [...seen.entries()].map(([userId, name]) => ({ userId, name }));
  }, [mode, permissions.students]);

  const startWith = async (otherUserId) => {
    const id = String(otherUserId || "").trim();
    if (!id) return;
    setCreatingId(id);
    setError(null);
    try {
      const created = await createDirectConversation(id);
      const cid = pickConversationId(created);
      if (!cid) {
        setError("Could not start conversation. Try again.");
        return;
      }
      setNewOpen(false);
      setManualId("");
      navigate(`${threadBase}/${cid}`);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Could not start conversation.";
      setError(typeof msg === "string" ? msg : "Could not start conversation.");
    } finally {
      setCreatingId("");
    }
  };

  const pickerContacts = mode === "student" ? contacts : staffStudents;

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) =>
      conversationTitle(c, currentUserId).toLowerCase().includes(q)
    );
  }, [conversations, search, currentUserId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--color-surface)]">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--color-border)] px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-base font-semibold text-gray-800">{t("chat.messages")}</h1>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 gap-1.5 text-xs"
            onClick={() => setNewOpen((v) => !v)}
          >
            <MessageCirclePlus size={15} />
            {t("chat.new")}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("chat.search")}
            className="w-full rounded-lg bg-gray-100 py-1.5 pl-8 pr-7 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:bg-white focus:ring-1 focus:ring-[var(--color-border)]"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="shrink-0 border-b border-[var(--color-border)] bg-red-50 px-4 py-2.5">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      ) : null}

      {/* New Conversation Panel */}
      {newOpen ? (
        <div className="shrink-0 border-b border-[var(--color-border)] bg-gray-50 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t("chat.startConversation")}
          </p>
          {mode === "student" && contactsLoading ? (
            <div className="flex justify-center py-3">
              <Loader />
            </div>
          ) : pickerContacts.length > 0 ? (
            <ul className="mb-3 max-h-36 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              {pickerContacts.map((c) => (
                <li key={c.userId} className="border-b border-[var(--color-border)] last:border-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => startWith(c.userId)}
                    disabled={!!creatingId}
                  >
                    <span className="truncate">{c.name}</span>
                    {creatingId === c.userId ? (
                      <span className="text-xs text-gray-400">…</span>
                    ) : (
                      <ChevronRight size={14} className="shrink-0 text-gray-300" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-xs text-gray-400">
              {mode === "student"
                ? t("chat.noTeachersFound")
                : t("chat.noStudentsFound")}
            </p>
          )}
          <div className="flex gap-2">
            <input
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder={t("chat.pasteUserId")}
              className="min-h-9 flex-1 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-primary-500"
            />
            <Button
              type="button"
              disabled={!manualId.trim() || !!creatingId}
              onClick={() => startWith(manualId)}
            >
              {t("chat.go")}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Conversation List */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-24 md:pb-0">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        ) : filteredConversations.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">
            {search
              ? t("chat.noConversationsSearch")
              : t("chat.noConversations")}
          </p>
        ) : (
          <ul>
            {filteredConversations.map((c) => {
              const cid = conversationId(c);
              if (!cid) return null;
              const title = conversationTitle(c, currentUserId);
              const isActive = cid === activeId;
              const lastMsg = conversationLastMessage(c);
              const unread = conversationUnreadCount(c);
              return (
                <li key={cid} className="border-b border-[var(--color-border)] last:border-0">
                  <Link
                    to={`${threadBase}/${cid}`}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      isActive ? "bg-primary-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <Avatar name={title} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-sm font-medium ${
                            isActive ? "text-primary-700" : "text-gray-800"
                          }`}
                        >
                          {title}
                        </p>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {conversationUpdatedAt(c) ? (
                            <span className="text-[11px] text-gray-400">
                              {relativeTimeLabel(conversationUpdatedAt(c))}
                            </span>
                          ) : null}
                          {unread > 0 ? (
                            <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {lastMsg ? (
                        <p
                          className={`mt-0.5 truncate text-xs ${
                            unread > 0 ? "font-medium text-gray-600" : "text-gray-400"
                          }`}
                        >
                          {lastMsg}
                        </p>
                      ) : null}
                    </div>
                    {!isActive && !unread ? (
                      <ChevronRight size={14} className="shrink-0 text-gray-300" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
