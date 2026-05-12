import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCirclePlus, ChevronRight, Search, X, ChevronLeft, Megaphone } from "lucide-react";
import { Button } from "../../ui-components";
import Loader from "../../ui-components/Loader";
import { useAuth } from "../../store/auth.store";
import { usePermissions } from "../../store/permissions.store";
import { listTeachersBySection } from "../../api/teacher.api";
import { listConversations } from "../../api/chat.api";
import {
  conversationId,
  conversationLastMessage,
  conversationTitle,
  conversationUnreadCount,
  conversationUpdatedAt,
  relativeTimeLabel,
} from "./chatUtils";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

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

/** Conversation list: brand primary. New-chat picker: teal for teachers, violet for students. */
function Avatar({ name, size = "md", palette = "default" }) {
  const sz = size === "lg" ? "h-12 w-12 text-sm" : "h-10 w-10 text-xs";
  const ring = "ring-1 ring-inset";
  const palettes = {
    default: clsx("bg-primary-100 text-primary-800", ring, "ring-primary-200/80"),
    teacher: clsx("bg-teal-100 text-teal-900", ring, "ring-teal-300/60"),
    student: clsx("bg-violet-100 text-violet-900", ring, "ring-violet-300/60"),
  };
  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full font-bold shadow-sm",
        palettes[palette] ?? palettes.default,
        sz,
      )}
    >
      {getInitials(name)}
    </div>
  );
}

function teacherRowToContact(row, fallbackName) {
  const userId = String(row.teacher_id ?? row.id ?? "").trim();
  const name =
    [row.teacher_first_name, row.teacher_middle_name, row.teacher_last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || fallbackName;
  return userId ? { userId, name } : null;
}

/**
 * @param {{ mode: 'student' | 'staff', threadBase: string, activeId?: string }} props
 */
export default function ChatInbox({ mode, threadBase, activeId = "" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { permissions } = usePermissions();
  const currentUserId = String(auth?.userId ?? "").trim();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
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
        t("chat.couldNotLoadConversations");
      setError(typeof msg === "string" ? msg : t("chat.couldNotLoadConversations"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const refreshConversations = useCallback(async () => {
    try {
      const list = await listConversations();
      const sorted = [...list].sort(
        (a, b) =>
          new Date(conversationUpdatedAt(b) || 0).getTime() -
          new Date(conversationUpdatedAt(a) || 0).getTime()
      );
      setConversations(sorted);
    } catch {
      /* ignore transient poll errors */
    }
  }, []);

  // Refetch when the open thread changes so a newly created conversation appears after first send
  // (draft route uses activeId ""; navigating to /chat/:id updates activeId and triggers reload).
  useEffect(() => {
    loadConversations();
  }, [activeId, loadConversations]);

  // Poll so unread counts and new conversations appear without a page navigate.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshConversations();
    }, 8000);
    return () => window.clearInterval(id);
  }, [refreshConversations]);

  // Student: teachers in my section (existing API). Staff: students from permissions only — no list-by-section.
  useEffect(() => {
    if (mode !== "student") {
      setContacts([]);
      setContactsLoading(false);
      return;
    }

    const campusId = auth.campus_id;
    const sectionId = auth.sections?.section_id;
    if (!campusId || !sectionId) {
      setContacts([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setContactsLoading(true);
      try {
        const list = await listTeachersBySection(campusId, sectionId);
        if (!cancelled) {
          const rows = list
            .map((row) => teacherRowToContact(row, t("chat.defaultTeacherName")))
            .filter(Boolean)
            .filter((row) => row.userId !== currentUserId);
          setContacts(rows);
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
  }, [mode, auth.campus_id, auth.sections, currentUserId, t]);

  const staffStudents = useMemo(() => {
    if (mode !== "staff") return [];
    const seen = new Map();
    for (const s of permissions.students || []) {
      const id = String(s.student_id ?? "").trim();
      if (!id || seen.has(id)) continue;
      seen.set(
        id,
        String(s.student_name || t("chat.defaultStudentName")).trim() ||
          t("chat.defaultStudentName"),
      );
    }
    return [...seen.entries()]
      .map(([userId, name]) => ({ userId, name }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [mode, permissions.students, t]);

  const pickerPeople = mode === "student" ? contacts : staffStudents;

  const startWith = (otherUserId, displayName = "") => {
    const id = String(otherUserId || "").trim();
    if (!id) return;
    setError(null);
    const q = new URLSearchParams({ with: id });
    const name = String(displayName || "").trim();
    if (name) q.set("name", name);
    setNewOpen(false);
    setContactSearch("");
    setManualId("");
    navigate(`${threadBase}/new?${q.toString()}`);
  };

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) =>
      conversationTitle(c, currentUserId).toLowerCase().includes(q),
    );
  }, [conversations, search, currentUserId]);

  const filteredPickerPeople = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return pickerPeople;
    return pickerPeople.filter((c) => c.name.toLowerCase().includes(q));
  }, [pickerPeople, contactSearch]);

  const closeNewPicker = () => {
    setNewOpen(false);
    setContactSearch("");
    setManualId("");
  };

  const emptyPickerCopy =
    mode === "student" ? t("chat.noTeachersFound") : t("chat.noStudentsFound");

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--color-surface)]">
      {!newOpen ? (
        <>
          <div className="shrink-0 border-b border-[var(--color-border)] bg-gradient-to-b from-[var(--color-primary-50)]/50 to-[var(--color-surface)] px-4 pb-3 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-base font-semibold text-gray-900">{t("chat.messages")}</h1>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {mode === "staff" ? (
                  <Link
                    to={`${threadBase}/broadcast`}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-primary-200/80 bg-white/90 px-3 text-xs font-semibold text-primary-800 shadow-sm ring-1 ring-gray-200/50 transition hover:bg-primary-50/90 focus:outline-none focus:ring-2 focus:ring-primary-200/80"
                  >
                    <Megaphone size={15} className="text-primary-600" aria-hidden />
                    {t("chat.broadcast.openBroadcast")}
                  </Link>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 gap-1.5 border-primary-200/80 bg-primary-50/90 text-xs font-semibold text-primary-800 hover:bg-primary-100/90"
                  onClick={() => {
                    setContactSearch("");
                    setNewOpen(true);
                  }}
                >
                  <MessageCirclePlus size={15} className="text-primary-600" />
                  {t("chat.new")}
                </Button>
              </div>
            </div>

            <div className="relative mt-3">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/70"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("chat.search")}
                className="w-full rounded-xl border border-transparent bg-white/90 py-2 pl-9 pr-8 text-sm text-gray-800 shadow-sm outline-none ring-1 ring-gray-200/60 placeholder:text-gray-400 focus:border-primary-200 focus:bg-white focus:ring-2 focus:ring-primary-200/80"
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

          {error ? (
            <div className="shrink-0 border-b border-red-100 bg-gradient-to-r from-red-50 to-amber-50/40 px-4 py-2.5">
              <p className="text-xs font-medium text-red-700">{error}</p>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--color-background)]/40 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader />
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">
                {search ? t("chat.noConversationsSearch") : t("chat.noConversations")}
              </p>
            ) : (
              <ul>
                {filteredConversations.map((c) => {
                  const cid = conversationId(c);
                  if (!cid) return null;
                  const title = conversationTitle(c, currentUserId);
                  const isActive = cid === activeId;
                  const lastMsg = conversationLastMessage(c);
                  const unread = isActive ? 0 : conversationUnreadCount(c);
                  const hasUnread = unread > 0;
                  return (
                    <li key={cid} className="border-b border-[var(--color-border)]/80 last:border-0">
                      <Link
                        to={`${threadBase}/${cid}`}
                        className={clsx(
                          "flex items-center gap-3 border-l-[3px] py-3 pl-[13px] pr-4 transition-colors",
                          isActive &&
                            "border-l-primary-600 bg-gradient-to-r from-primary-50 to-primary-50/20",
                          !isActive &&
                            hasUnread &&
                            "border-l-amber-500 bg-amber-50/35 hover:bg-amber-50/55",
                          !isActive &&
                            !hasUnread &&
                            "border-l-transparent hover:bg-[var(--color-surface)]",
                        )}
                      >
                        <Avatar name={title} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={clsx(
                                "truncate text-sm font-semibold",
                                isActive && "text-primary-900",
                                !isActive && hasUnread && "text-gray-900",
                                !isActive && !hasUnread && "text-gray-800",
                              )}
                            >
                              {title}
                            </p>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {conversationUpdatedAt(c) ? (
                                <span
                                  className={clsx(
                                    "text-[11px] tabular-nums",
                                    hasUnread ? "font-medium text-amber-800/80" : "text-gray-400",
                                  )}
                                >
                                  {relativeTimeLabel(conversationUpdatedAt(c))}
                                </span>
                              ) : null}
                              {hasUnread ? (
                                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white shadow-sm ring-1 ring-amber-600/30">
                                  {unread > 99 ? "99+" : unread}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {lastMsg ? (
                            <p
                              className={clsx(
                                "mt-0.5 truncate text-xs leading-snug",
                                hasUnread ? "font-medium text-gray-700" : "text-gray-500",
                              )}
                            >
                              {lastMsg}
                            </p>
                          ) : null}
                        </div>
                        {!isActive && !hasUnread ? (
                          <ChevronRight size={14} className="shrink-0 text-gray-300" aria-hidden />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      ) : (
        <>
          <header className="shrink-0 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-primary-50)] via-white to-teal-50/40 px-2 py-2 pt-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={closeNewPicker}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary-800/90 hover:bg-white/80 hover:shadow-sm"
                aria-label={t("chat.backToConversations")}
              >
                <ChevronLeft size={22} />
              </button>
              <h1 className="min-w-0 flex-1 text-lg font-semibold tracking-tight text-gray-900">
                {t("chat.newChatTitle")}
              </h1>
            </div>
          </header>

          {error ? (
            <div className="shrink-0 border-b border-red-100 bg-gradient-to-r from-red-50 to-amber-50/40 px-4 py-2.5">
              <p className="text-xs font-medium text-red-700">{error}</p>
            </div>
          ) : null}

          <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/70"
              />
              <input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder={t("chat.searchContacts")}
                className="w-full rounded-xl border border-transparent bg-gray-50 py-2.5 pl-9 pr-8 text-sm text-gray-900 shadow-inner outline-none ring-1 ring-gray-200/50 placeholder:text-gray-400 focus:border-primary-200 focus:bg-white focus:ring-2 focus:ring-primary-200/80"
              />
              {contactSearch ? (
                <button
                  type="button"
                  onClick={() => setContactSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--color-background)]/50">
            {mode === "student" && contactsLoading ? (
              <div className="flex justify-center py-16">
                <Loader />
              </div>
            ) : filteredPickerPeople.length > 0 ? (
              <ul className="divide-y divide-[var(--color-border)]/70">
                {filteredPickerPeople.map((c) => (
                  <li key={c.userId}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 bg-[var(--color-surface)] px-4 py-3.5 text-left transition-colors hover:bg-primary-50/50 active:bg-primary-50/80"
                      onClick={() => startWith(c.userId, c.name)}
                    >
                      <Avatar
                        name={c.name}
                        size="lg"
                        palette={mode === "staff" ? "student" : "teacher"}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-gray-900">{c.name}</p>
                        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                          {mode === "staff" ? t("chatUi.pickerRoleStudent") : t("chatUi.pickerRoleTeacher")}
                        </p>
                      </div>
                      <ChevronRight
                        size={18}
                        className="shrink-0 text-primary-400/80"
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-10 text-center text-sm text-gray-500">{emptyPickerCopy}</p>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200/90 bg-gradient-to-b from-slate-100/90 to-slate-50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_24px_rgba(15,23,42,0.06)]">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden />
              {t("chat.messageByUserId")}
            </p>
            <div className="flex gap-2">
              <input
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder={t("chat.pasteUserId")}
                className="min-h-10 flex-1 rounded-xl border border-slate-200/90 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
              <Button
                type="button"
                disabled={!manualId.trim()}
                onClick={() => startWith(manualId, "")}
              >
                {t("chat.go")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
