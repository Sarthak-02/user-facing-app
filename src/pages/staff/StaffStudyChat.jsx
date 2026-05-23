import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePermissions } from "../../store/permissions.store";
import { ragAsk } from "../../api/rag.api";
import { Button } from "../../ui-components";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  SendHorizontal,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";

const STUDY_SUBJECTS = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "English",
  "Hindi",
  "History",
  "Geography",
  "Political Science",
  "Economics",
  "Computer Science",
];

const CLASS_COLORS = [
  { badgeBg: "bg-teal-500", border: "border-l-teal-400", ring: "ring-teal-400" },
  { badgeBg: "bg-emerald-500", border: "border-l-emerald-400", ring: "ring-emerald-400" },
  { badgeBg: "bg-blue-500", border: "border-l-blue-400", ring: "ring-blue-400" },
  { badgeBg: "bg-indigo-500", border: "border-l-indigo-400", ring: "ring-indigo-400" },
  { badgeBg: "bg-violet-500", border: "border-l-violet-400", ring: "ring-violet-400" },
  { badgeBg: "bg-amber-500", border: "border-l-amber-400", ring: "ring-amber-400" },
  { badgeBg: "bg-rose-500", border: "border-l-rose-400", ring: "ring-rose-400" },
  { badgeBg: "bg-cyan-500", border: "border-l-cyan-400", ring: "ring-cyan-400" },
];

function getClassColor(classNum, idx) {
  if (classNum) {
    const n = parseInt(classNum, 10);
    if (n >= 1 && n <= 3) return CLASS_COLORS[1];
    if (n >= 4 && n <= 6) return CLASS_COLORS[2];
    if (n >= 7 && n <= 9) return CLASS_COLORS[3];
    if (n >= 10) return CLASS_COLORS[4];
  }
  return CLASS_COLORS[idx % CLASS_COLORS.length];
}

function extractClassNum(className) {
  const m = String(className || "").match(/\b(\d{1,2})\b/);
  return m ? m[1] : "";
}

function parseLabel(label) {
  const parts = label.split("·").map((p) => p.trim());
  return { className: parts[0] || label, sectionName: parts.slice(1).join("·").trim() };
}

function getClassBadge(className, sectionName) {
  const num = className.match(/\d+/)?.[0];
  const sectionChar = sectionName
    ? (sectionName.match(/[A-Za-z]/)?.[0] || "").toUpperCase()
    : "";
  if (num) return `${num}${sectionChar}`;
  return className.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "?";
}

function formatMatchPct(similarity) {
  if (similarity == null || Number.isNaN(Number(similarity))) return null;
  const n = Number(similarity);
  const pct = n <= 1 ? Math.round(n * 100) : Math.round(n);
  return Math.min(100, Math.max(0, pct));
}

const mdComponents = {
  h3: ({ ...props }) => (
    <h3 className="mt-4 first:mt-0 text-base font-semibold text-gray-900 dark:text-gray-100" {...props} />
  ),
  p: ({ ...props }) => (
    <p className="my-2.5 text-sm leading-relaxed text-gray-900 dark:text-gray-100" {...props} />
  ),
  ul: ({ ...props }) => (
    <ul className="my-2 list-disc space-y-1.5 pl-5 text-sm text-gray-900 dark:text-gray-100" {...props} />
  ),
  ol: ({ ...props }) => (
    <ol className="my-2 list-decimal space-y-1.5 pl-5 text-sm text-gray-900 dark:text-gray-100" {...props} />
  ),
  li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
  strong: ({ ...props }) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
  em: ({ ...props }) => <em className="italic" {...props} />,
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-black/5 dark:bg-white/10 p-3 text-xs font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isFenced = /\blanguage-/.test(className || "");
    if (isFenced) {
      return (
        <code className={`${className || ""} font-mono text-xs text-gray-900 dark:text-gray-100`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-black/5 dark:bg-white/10 px-1 py-0.5 text-[0.85em] font-mono text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </code>
    );
  },
};

function AnswerMarkdown({ markdown }) {
  if (!markdown?.trim()) return null;
  return (
    <div className="study-answer-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

function SourceBlock({ item, index }) {
  const { t } = useTranslation();
  const pct = formatMatchPct(item.similarity);
  const isQuestion = String(item.id || "").startsWith("question_");
  const locationParts = [item.chapter_title, item.section_title, item.subsection_title].filter(Boolean);

  return (
    <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary-100 px-2 text-[11px] font-semibold text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
          {index + 1}
        </span>
        {pct != null && (
          <span title={t("studyChat.matchScoreTitle")}>{t("studyChat.matchPercent", { pct })}</span>
        )}
        {item.page != null && item.page !== "" && (
          <span>{t("studyChat.pageLabel", { page: item.page })}</span>
        )}
      </div>
      {locationParts.length > 0 && (
        <p className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-100">
          {locationParts.join(" · ")}
        </p>
      )}
      {isQuestion && (
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">
          {t("studyChat.fromTextbookExercises")}
        </p>
      )}
      <p className="mt-2 text-sm leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
        {item.content}
      </p>
    </article>
  );
}

// ── Setup screen ──────────────────────────────────────────────────────────────

function SectionStep({ rows, selected, onSelect }) {
  return (
    <div className="space-y-2">
      {rows.map((r, idx) => {
        const { className, sectionName } = parseLabel(r.label);
        const classNum = extractClassNum(className);
        const badge = getClassBadge(className, sectionName);
        const color = getClassColor(classNum, idx);
        const isSelected = selected?.sectionId === r.sectionId;
        return (
          <button
            key={r.sectionId}
            type="button"
            onClick={() => onSelect(r)}
            className={`w-full flex items-center gap-4 rounded-xl border border-l-4 px-4 py-3.5 transition-all duration-150 ${
              isSelected
                ? `${color.border} bg-primary-50 dark:bg-primary-900/20 ring-2 ${color.ring}`
                : `${color.border} bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-sm hover:-translate-y-0.5`
            }`}
          >
            <div className={`w-9 h-9 rounded-lg ${color.badgeBg} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-bold text-sm tracking-tight">{badge}</span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{className}</p>
              {sectionName && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sectionName}</p>}
            </div>
            {isSelected ? (
              <div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center shrink-0">
                <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function SubjectGrid({ subjects, selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {subjects.map((sub) => {
        const isSelected = selected === sub;
        return (
          <button
            key={sub}
            type="button"
            onClick={() => onSelect(sub)}
            className={`rounded-xl border px-3 py-2.5 text-sm font-medium text-left transition-all duration-150 ${
              isSelected
                ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 ring-2 ring-primary-400"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-300 hover:bg-primary-50/50 dark:hover:bg-primary-900/10"
            }`}
          >
            {sub}
          </button>
        );
      })}
    </div>
  );
}

function SetupScreen({ rows, onStart }) {
  const { t } = useTranslation();
  const { getSubjectsBySection } = usePermissions();
  const [selectedSection, setSelectedSection] = useState(rows.length === 1 ? rows[0] : null);
  const [selectedSubject, setSelectedSubject] = useState("");

  const sectionSubjects = useMemo(() => {
    if (!selectedSection) return STUDY_SUBJECTS;
    const fromPerms = getSubjectsBySection(selectedSection.sectionId).map((s) => s.subject_name);
    if (fromPerms.length > 0) {
      return STUDY_SUBJECTS.filter((s) => fromPerms.some((p) => p.toLowerCase() === s.toLowerCase()));
    }
    return STUDY_SUBJECTS;
  }, [selectedSection, getSubjectsBySection]);

  const canStart = Boolean(selectedSection && selectedSubject);

  const handleStart = useCallback(() => {
    if (!canStart) return;
    onStart({ section: selectedSection, subject: selectedSubject });
  }, [canStart, selectedSection, selectedSubject, onStart]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--color-background)]">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-950 px-5 py-8 md:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">{t("studyChat.title")}</h1>
          </div>
          <p className="text-sm text-primary-100 leading-relaxed max-w-md">
            {t("staffStudyChat.subtitle")}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 space-y-6">
        {/* Section picker */}
        {rows.length > 1 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t("staffStudyChat.pickSection")}
              </h2>
            </div>
            <SectionStep rows={rows} selected={selectedSection} onSelect={setSelectedSection} />
          </section>
        )}

        {/* Selected section badge when only one */}
        {rows.length === 1 && selectedSection && (
          <div className="flex items-center gap-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 px-4 py-3">
            <Users className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {selectedSection.label}
            </span>
          </div>
        )}

        {/* Subject picker — only shown once a section is selected */}
        {selectedSection && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t("staffStudyChat.pickSubject")}
              </h2>
            </div>
            <SubjectGrid
              subjects={sectionSubjects}
              selected={selectedSubject}
              onSelect={setSelectedSubject}
            />
          </section>
        )}

        {/* CTA */}
        <Button
          variant="primary"
          className="w-full"
          disabled={!canStart}
          onClick={handleStart}
        >
          {t("studyChat.continue")}
        </Button>
      </div>
    </div>
  );
}

// ── Chat screen ───────────────────────────────────────────────────────────────

function ChatScreen({ section, subject, onBack }) {
  const { t } = useTranslation();
  const { permissions } = usePermissions();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const classNum = useMemo(() => {
    const cls = (permissions.classes || []).find((c) => c.class_id === section.classId);
    return cls ? extractClassNum(cls.class_name) : section.classNum || "";
  }, [permissions.classes, section]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || sending || !subject || !classNum) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setSending(true);

    try {
      const payload = await ragAsk({ question: q, class: classNum, subject, top_k: 5 });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", answer: payload.answer, sources: payload.sources },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", error: e?.message || t("studyChat.errorGeneric") },
      ]);
    } finally {
      setSending(false);
    }
  };

  const { className, sectionName } = parseLabel(section.label);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-3.5rem)] flex-col bg-[var(--color-background)] pb-16 md:pb-0">
      {/* Chat header */}
      <header className="flex-shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-2 text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
            aria-label={t("common.back")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {subject}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Users className="h-3 w-3 inline" />
              {className}
              {sectionName ? ` · ${sectionName}` : ""}
              {classNum ? ` · ${t("studyChat.headerSubtitle", { class: classNum, suffix: t("studyChat.textbookQa") })}` : ""}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("staffStudyChat.emptyStateTitle", { subject })}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("staffStudyChat.emptyStateHint")}
              </p>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary-600 px-4 py-2.5 text-sm text-white shadow-sm">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-start">
                <div className="max-w-[95%] space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      {m.error ? (
                        <p className="rounded-2xl rounded-bl-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                          {m.error}
                        </p>
                      ) : (
                        <>
                          <div className="rounded-2xl rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-sm">
                            {m.answer?.trim() ? (
                              <AnswerMarkdown markdown={m.answer} />
                            ) : (
                              <p className="text-sm text-gray-800 dark:text-gray-200">
                                {t("studyChat.noAnswerReturned")}
                              </p>
                            )}
                          </div>
                          {m.sources?.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {t("studyChat.textbookSources")}
                              </p>
                              <div className="space-y-3">
                                {m.sources.map((item, j) => (
                                  <SourceBlock key={item.id || j} item={item} index={j} />
                                ))}
                              </div>
                            </div>
                          )}
                          {!m.answer?.trim() && !m.sources?.length && (
                            <p className="rounded-2xl rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                              {t("studyChat.tryRephrase")}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-gray-500">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary-500" />
                {t("studyChat.preparingAnswer")}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t("staffStudyChat.placeholder", { subject })}
            className="min-h-[44px] max-h-32 flex-1 resize-y rounded-xl border border-[var(--color-border)] bg-[rgb(var(--color-surface))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-600))]"
            disabled={sending}
          />
          <Button
            variant="primary"
            className="shrink-0 self-end px-3 md:px-4"
            loading={sending}
            disabled={sending || !input.trim()}
            onClick={handleSend}
            aria-label={t("studyChat.sendAria")}
          >
            <SendHorizontal className="h-5 w-5 md:hidden" />
            <span className="hidden md:inline">{t("studyChat.send")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function StaffStudyChat() {
  const { permissions } = usePermissions();
  const [session, setSession] = useState(null);

  const rows = useMemo(() => {
    const sections = permissions.sections || [];
    return sections.map((s) => {
      const cls = (permissions.classes || []).find((c) => c.class_id === s.class_id);
      return {
        sectionId: s.section_id,
        classId: s.class_id,
        classNum: cls ? extractClassNum(cls.class_name) : "",
        label: cls ? `${cls.class_name} · ${s.section_name}` : s.section_name,
      };
    });
  }, [permissions.sections, permissions.classes]);

  if (session) {
    return (
      <ChatScreen
        section={session.section}
        subject={session.subject}
        onBack={() => setSession(null)}
      />
    );
  }

  return <SetupScreen rows={rows} onStart={setSession} />;
}
