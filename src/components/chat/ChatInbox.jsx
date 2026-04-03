import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCirclePlus, ChevronRight } from "lucide-react";
import { Card, Button } from "../../ui-components";
import Loader from "../../ui-components/Loader";
import { useAuth } from "../../store/auth.store";
import { usePermissions } from "../../store/permissions.store";
import { getStudentHomeworkAll } from "../../api/homework.api";
import {
  listConversations,
  createDirectConversation,
  pickConversationId,
} from "../../api/chat.api";
import {
  conversationId,
  conversationTitle,
  conversationUpdatedAt,
} from "./chatUtils";

function homeworkTeacherRows(homeworkList) {
  const map = new Map();
  for (const h of homeworkList || []) {
    const id = String(
      h.teacher_id ||
        h.teacherId ||
        h.teacher?.teacher_id ||
        h.teacher?.id ||
        h.created_by?.id ||
        h.created_by ||
        ""
    ).trim();
    if (!id) continue;
    const name = String(
      h.teacher?.teacher_name ||
        h.teacher_name ||
        h.assignedBy ||
        h.created_by?.name ||
        "Teacher"
    ).trim();
    if (!map.has(id)) map.set(id, name);
  }
  return [...map.entries()].map(([userId, name]) => ({ userId, name }));
}

/**
 * @param {{ mode: 'student' | 'staff', threadBase: string }} props
 */
export default function ChatInbox({ mode, threadBase }) {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const currentUserId = String(auth?.userId ?? "").trim();
  const { permissions } = usePermissions();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    if (mode !== "student" || !auth.userId) return;
    let cancelled = false;
    (async () => {
      setContactsLoading(true);
      try {
        const res = await getStudentHomeworkAll({
          student_id: auth.userId,
          status: "PUBLISHED",
          limit: 100,
          offset: 0,
        });
        const rows = res?.data ?? res ?? [];
        const list = Array.isArray(rows) ? rows : [];
        if (!cancelled) setContacts(homeworkTeacherRows(list));
      } catch {
        if (!cancelled) setContacts([]);
      } finally {
        if (!cancelled) setContactsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, auth.userId]);

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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--color-background)] p-4 pb-28 md:p-6">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-950 text-gray-100">
              Messages
            </h1>
            
          </div>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 gap-1.5"
            onClick={() => setNewOpen((v) => !v)}
          >
            <MessageCirclePlus size={18} />
            New
          </Button>
        </div>

        {error ? (
          <Card className="border border-error-200 bg-error-50/80 p-4 border-error-900 bg-error-950/40">
            <p className="text-sm font-semibold text-error-800 text-error-200">
              {error}
            </p>
          </Card>
        ) : null}

        {newOpen ? (
          <Card className="border border-gray-100 p-4 shadow-sm border-gray-800">
            <p className="mb-3 text-sm font-bold text-gray-950 text-gray-100">
              Start a conversation
            </p>
            {mode === "student" && contactsLoading ? (
              <div className="flex justify-center py-6">
                <Loader />
              </div>
            ) : pickerContacts.length > 0 ? (
              <ul className="mb-4 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-100 border-gray-700">
                {pickerContacts.map((c) => (
                  <li key={c.userId}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold text-gray-950 hover:bg-primary-50 text-gray-100 hover:bg-primary-950/30"
                      onClick={() => startWith(c.userId)}
                      disabled={!!creatingId}
                    >
                      <span className="truncate">{c.name}</span>
                      {creatingId === c.userId ? (
                        <span className="text-xs text-gray-500">…</span>
                      ) : (
                        <ChevronRight size={16} className="shrink-0 text-gray-400" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 text-sm font-semibold text-gray-700 text-gray-400">
                {mode === "student"
                  ? "No teachers found from your homework yet. Use the field below with a user ID from your school."
                  : "No students in your permissions yet. Use the field below with a student user ID."}
              </p>
            )}
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 text-gray-400">
              User ID
            </label>
            <div className="mt-1 flex gap-2">
              <input
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Paste user ID"
                className="min-h-10 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 outline-none focus:border-primary-500 border-gray-600 bg-gray-800 text-gray-100"
              />
              <Button
                type="button"
                disabled={!manualId.trim() || !!creatingId}
                onClick={() => startWith(manualId)}
              >
                Go
              </Button>
            </div>
          </Card>
        ) : null}

        <Card className="border border-gray-100 shadow-sm border-gray-800">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader />
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-6 text-center text-sm font-semibold text-gray-700 text-gray-400">
              No conversations yet. Start one with New.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 divide-gray-800">
              {conversations.map((c) => {
                const id = conversationId(c);
                if (!id) return null;
                return (
                  <li key={id}>
                    <Link
                      to={`${threadBase}/${id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 hover:bg-gray-800/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-950 text-gray-100">
                          {conversationTitle(c, currentUserId)}
                        </p>
                        {conversationUpdatedAt(c) ? (
                          <p className="mt-0.5 text-xs font-semibold text-gray-500 text-gray-400">
                            {new Date(
                              conversationUpdatedAt(c)
                            ).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                      <ChevronRight
                        size={18}
                        className="shrink-0 text-gray-400"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
