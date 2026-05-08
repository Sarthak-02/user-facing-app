import { useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { Button } from "../../ui-components";
import { usePermissions } from "../../store/permissions.store";
import { broadcastChatMessage } from "../../api/chat.api";

const MAX_RECIPIENTS = 500;
const MAX_BODY = 20000;

const CHAT_BASE = "/staff/chat";

export default function StaffChatBroadcast() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { permissions } = usePermissions();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  /** @type {'recipients' | 'compose'} */
  const [step, setStep] = useState("recipients");

  const recipients = useMemo(() => {
    const seen = new Map();
    for (const s of permissions.students || []) {
      const id = String(s.student_id ?? "").trim();
      if (!id || seen.has(id)) continue;
      const name =
        String(s.student_name || t("chat.defaultStudentName")).trim() ||
        t("chat.defaultStudentName");
      seen.set(id, { userId: id, name });
    }
    return [...seen.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, [permissions.students, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipients, query]);

  const toggle = useCallback((userId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
        return next;
      }
      if (next.size >= MAX_RECIPIENTS) return prev;
      next.add(userId);
      return next;
    });
  }, []);

  const selectAllRecipients = useCallback(() => {
    setSelected(() => {
      const next = new Set();
      for (const r of recipients) {
        if (next.size >= MAX_RECIPIENTS) break;
        next.add(r.userId);
      }
      return next;
    });
  }, [recipients]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const onBroadcast = async (e) => {
    e.preventDefault();
    const ids = [...selected];
    const text = body.trim();
    setError(null);
    if (ids.length === 0) {
      setError(t("chat.broadcast.errorNoRecipients"));
      return;
    }
    if (!text) {
      setError(t("chat.broadcast.errorNoBody"));
      return;
    }
    if (text.length > MAX_BODY) {
      setError(t("chat.broadcast.errorBodyTooLong", { max: MAX_BODY }));
      return;
    }
    setSubmitting(true);
    try {
      await broadcastChatMessage({ recipient_user_ids: ids, body: text });
      navigate(CHAT_BASE, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        t("chat.broadcast.errorSendFailed");
      setError(typeof msg === "string" ? msg : t("chat.broadcast.errorSendFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const atCap = selected.size >= MAX_RECIPIENTS;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-background)]">
      <header className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 md:px-4">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(CHAT_BASE)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
            aria-label={t("chat.broadcast.back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Megaphone className="h-5 w-5 shrink-0 text-primary-600" aria-hidden />
              <span className="truncate">{t("chat.broadcast.title")}</span>
            </h1>
          </div>
          <Link
            to={CHAT_BASE}
            className="hidden shrink-0 text-sm font-medium text-primary-600 hover:text-primary-700 md:inline"
          >
            {t("chat.broadcast.back")}
          </Link>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden px-3 md:px-4">
        <form
          onSubmit={onBroadcast}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden pb-[env(safe-area-inset-bottom)] pt-4"
        >
          {error ? (
            <div className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          ) : null}

          {step === "recipients" ? (
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">{t("chat.broadcast.recipientsHeading")}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" className="text-xs" onClick={selectAllRecipients}>
                  {t("chat.broadcast.selectAll")}
                </Button>
                <Button type="button" variant="ghost" className="text-xs" onClick={clearSelection}>
                  {t("chat.broadcast.clearAll")}
                </Button>
              </div>
            </div>
            <p className="mt-1 shrink-0 text-xs text-gray-500">{t("chat.broadcast.maxNote", { max: MAX_RECIPIENTS })}</p>
            <p className="mt-2 shrink-0 text-sm font-medium text-primary-800">
              {t("chat.broadcast.selectedCount", { count: selected.size, max: MAX_RECIPIENTS })}
            </p>

            <div className="relative mt-3 shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("chat.broadcast.searchPlaceholder")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-gray-50 py-2 pl-9 pr-8 text-sm outline-none focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100"
              />
              {query ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <ul className="mt-3 min-h-0 flex-1 divide-y divide-[var(--color-border)] overflow-y-auto overscroll-contain rounded-lg border border-[var(--color-border)]">
              {filtered.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-gray-500">
                  {recipients.length === 0
                    ? t("chat.broadcast.emptyRecipientList")
                    : t("chat.broadcast.noSearchResults")}
                </li>
              ) : (
                filtered.map((r) => {
                  const isOn = selected.has(r.userId);
                  const disabled = atCap && !isOn;
                  return (
                    <li key={r.userId}>
                      <label
                        className={clsx(
                          "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors",
                          isOn && "bg-primary-50/80",
                          disabled && "cursor-not-allowed opacity-50",
                          !disabled && !isOn && "hover:bg-gray-50",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={isOn}
                          disabled={disabled}
                          onChange={() => toggle(r.userId)}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                          {r.name}
                        </span>
                      </label>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
          ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <section className="shrink-0 rounded-xl border border-[var(--color-border)] bg-primary-50/60 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">
                  {t("chat.broadcast.broadcastingTo", { count: selected.size })}
                </p>
                <Button type="button" variant="ghost" className="text-xs shrink-0" onClick={() => setStep("recipients")}>
                  {t("chat.broadcast.changeRecipients")}
                </Button>
              </div>
            </section>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
              <label className="shrink-0 text-sm font-semibold text-gray-900" htmlFor="broadcast-body">
                {t("chat.broadcast.messageLabel")}
              </label>
              <textarea
                id="broadcast-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("chat.broadcast.messagePlaceholder")}
                maxLength={MAX_BODY}
                rows={6}
                className={clsx(
                  "mt-2 min-h-[8rem] w-full flex-1 resize-none overflow-y-auto rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900",
                  "placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600",
                )}
              />
              <p className="mt-2 shrink-0 text-right text-xs text-gray-500">
                {body.length} / {MAX_BODY}
              </p>
            </section>
          </div>
          )}

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-background)] py-3 pt-3">
            {step === "recipients" ? (
              <>
                <Button type="button" variant="secondary" onClick={() => navigate(CHAT_BASE)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={selected.size === 0}
                  onClick={() => {
                    setError(null);
                    setStep("compose");
                  }}
                >
                  {t("chat.broadcast.createMessage")}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="secondary" onClick={() => setStep("recipients")}>
                  {t("chat.broadcast.backToRecipients")}
                </Button>
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={submitting || selected.size === 0 || !body.trim()}
                >
                  {t("chat.broadcast.send")}
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
