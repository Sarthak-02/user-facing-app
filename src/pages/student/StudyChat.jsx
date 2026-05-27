import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button, Select } from "../../ui-components";
import { useAuth } from "../../store/auth.store";
import { ragAsk } from "../../api/rag.api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import MermaidDiagram from "../../components/MermaidDiagram";
import {
  Sparkles, SendHorizontal, BookMarked, ChevronLeft, ChevronDown,
  FlaskConical, Calculator, Leaf, Globe, Landmark, Building2,
  TrendingUp, Code2, Zap, BookOpen,
} from "lucide-react";

/** API `subject` values (English) for RAG; labels come from i18n. */
const STUDY_SUBJECTS = [
  { apiValue: "Physics", labelKey: "studyChat.subjectOptions.physics" },
  { apiValue: "Chemistry", labelKey: "studyChat.subjectOptions.chemistry" },
  { apiValue: "Mathematics", labelKey: "studyChat.subjectOptions.mathematics" },
  { apiValue: "Biology", labelKey: "studyChat.subjectOptions.biology" },
  { apiValue: "English", labelKey: "studyChat.subjectOptions.english" },
  { apiValue: "Hindi", labelKey: "studyChat.subjectOptions.hindi" },
  { apiValue: "History", labelKey: "studyChat.subjectOptions.history" },
  { apiValue: "Geography", labelKey: "studyChat.subjectOptions.geography" },
  { apiValue: "Political Science", labelKey: "studyChat.subjectOptions.politicalScience" },
  { apiValue: "Economics", labelKey: "studyChat.subjectOptions.economics" },
  { apiValue: "Computer Science", labelKey: "studyChat.subjectOptions.computerScience" },
];

const CLASS_NUMBERS = ["6", "7", "8", "9", "10", "11", "12"];

const SUBJECT_META = {
  Physics:           { Icon: Zap,          icon: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/20",   border: "border-amber-200 dark:border-amber-800"   },
  Chemistry:         { Icon: FlaskConical, icon: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800" },
  Mathematics:       { Icon: Calculator,   icon: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-900/20",     border: "border-blue-200 dark:border-blue-800"     },
  Biology:           { Icon: Leaf,         icon: "text-green-600 dark:text-green-400",   bg: "bg-green-50 dark:bg-green-900/20",   border: "border-green-200 dark:border-green-800"   },
  English:           { Icon: BookOpen,     icon: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800" },
  Hindi:             { Icon: BookOpen,     icon: "text-red-600 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-900/20",       border: "border-red-200 dark:border-red-800"       },
  History:           { Icon: Landmark,     icon: "text-stone-600 dark:text-stone-400",   bg: "bg-stone-50 dark:bg-stone-900/20",   border: "border-stone-200 dark:border-stone-800"   },
  Geography:         { Icon: Globe,        icon: "text-teal-600 dark:text-teal-400",     bg: "bg-teal-50 dark:bg-teal-900/20",     border: "border-teal-200 dark:border-teal-800"     },
  "Political Science": { Icon: Building2,  icon: "text-slate-600 dark:text-slate-400",   bg: "bg-slate-50 dark:bg-slate-900/20",   border: "border-slate-200 dark:border-slate-800"   },
  Economics:         { Icon: TrendingUp,   icon: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20", border: "border-indigo-200 dark:border-indigo-800" },
  "Computer Science":{ Icon: Code2,        icon: "text-cyan-600 dark:text-cyan-400",     bg: "bg-cyan-50 dark:bg-cyan-900/20",     border: "border-cyan-200 dark:border-cyan-800"     },
};
const DEFAULT_META = { Icon: BookMarked, icon: "text-primary-600 dark:text-primary-400", bg: "bg-primary-50 dark:bg-primary-900/20", border: "border-primary-200 dark:border-primary-800" };

const SUGGESTED_QUESTIONS = {
  Physics:             ["Explain Newton's laws of motion", "How does electricity flow in a circuit?", "What is the difference between speed and velocity?"],
  Chemistry:           ["What are acids and bases?", "Explain the periodic table", "How does a chemical reaction happen?"],
  Mathematics:         ["Explain the Pythagorean theorem", "How do I solve quadratic equations?", "What is a derivative?"],
  Biology:             ["How does photosynthesis work?", "What is the role of DNA?", "Explain the human digestive system"],
  English:             ["What is a metaphor?", "How do I write a good essay introduction?", "Explain active vs passive voice"],
  Hindi:               ["संज्ञा के भेद बताइए", "रस कितने प्रकार के होते हैं?", "क्रिया और क्रिया विशेषण में अंतर"],
  History:             ["What caused World War I?", "Who was Mahatma Gandhi?", "What was the French Revolution?"],
  Geography:           ["Explain the water cycle", "What causes earthquakes?", "What are the different climate zones?"],
  "Political Science": ["What is democracy?", "Explain fundamental rights", "What is federalism?"],
  Economics:           ["What is GDP and how is it measured?", "Explain supply and demand", "What causes inflation?"],
  "Computer Science":  ["What is an algorithm?", "Explain object-oriented programming", "How does the internet work?"],
};

function inferClassFromAuth(auth) {
  const label =
    auth?.details?.sections?.[0]?.label ||
    auth?.sections?.[0]?.label ||
    "";
  const m = String(label).match(/^(\d{1,2})\b/);
  return m ? m[1] : "";
}

function formatMatchPct(similarity) {
  if (similarity == null || Number.isNaN(Number(similarity))) return null;
  const n = Number(similarity);
  const pct = n <= 1 ? Math.round(n * 100) : Math.round(n);
  return Math.min(100, Math.max(0, pct));
}

const mdComponents = {
  h3: ({ ...props }) => (
    <h3
      className="mt-4 first:mt-0 text-base font-semibold text-gray-900 dark:text-gray-100"
      {...props}
    />
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
  pre: ({ children }) => {
    const child = Array.isArray(children) ? children[0] : children;
    const lang = (child?.props?.className || "").replace("language-", "");
    const content = String(child?.props?.children || "").replace(/\n$/, "");
    if (lang === "mermaid") return <MermaidDiagram code={content} />;
    if (lang === "svg") {
      return (
        <div
          className="my-3 overflow-x-auto rounded-lg [&>svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    return (
      <pre className="my-2 overflow-x-auto rounded-lg bg-black/5 dark:bg-white/10 p-3 text-xs font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap [&>code]:bg-transparent [&>code]:p-0">
        {children}
      </pre>
    );
  },
  code: ({ className, children, ...props }) => {
    const isFenced = /\blanguage-/.test(className || "");
    if (isFenced) {
      return (
        <code
          className={`${className || ""} font-mono text-xs text-gray-900 dark:text-gray-100`}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-black/5 dark:bg-white/10 px-1 py-0.5 text-[0.85em] font-mono text-gray-900 dark:text-gray-100"
        {...props}
      >
        {children}
      </code>
    );
  },
};

function DiagramBlock({ diagram }) {
  if (!diagram?.type || !diagram?.content) return null;
  if (diagram.type === "mermaid") {
    return (
      <div className="rounded-2xl rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-sm overflow-x-auto">
        <MermaidDiagram code={diagram.content} />
      </div>
    );
  }
  if (diagram.type === "svg") {
    return (
      <div
        className="rounded-2xl rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-sm overflow-x-auto [&>svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: diagram.content }}
      />
    );
  }
  return (
    <pre className="rounded-2xl rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-xs font-mono text-gray-900 dark:text-gray-100 whitespace-pre overflow-x-auto shadow-sm">
      {diagram.content}
    </pre>
  );
}

function AnswerMarkdown({ markdown }) {
  if (!markdown?.trim()) return null;
  return (
    <div className="study-answer-md">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]} components={mdComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

function SourceBlock({ item, index }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const pct = formatMatchPct(item.similarity);
  const isQuestion = String(item.id || "").startsWith("question_");
  const locationParts = [
    item.chapter_title,
    item.section_title,
    item.subsection_title,
  ].filter(Boolean);

  return (
    <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary-100 px-1.5 text-[11px] font-semibold text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
          {index + 1}
        </span>
        {locationParts.length > 0 && (
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {locationParts.join(" · ")}
          </span>
        )}
        {isQuestion && (
          <span className="font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">
            {t("studyChat.fromTextbookExercises")}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          {pct != null && <span title={t("studyChat.matchScoreTitle")}>{t("studyChat.matchPercent", { pct })}</span>}
          {item.page != null && item.page !== "" && (
            <span>{t("studyChat.pageLabel", { page: item.page })}</span>
          )}
        </span>
      </div>
      {item.content && (
        <>
          <p className={`mt-1.5 text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap ${expanded ? "" : "line-clamp-2"}`}>
            {item.content}
          </p>
          {item.content.length > 120 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs text-primary-600 hover:underline dark:text-primary-400"
            >
              {expanded ? t("studyChat.showLess", "Show less") : t("studyChat.showMore", "Show more")}
            </button>
          )}
        </>
      )}
    </article>
  );
}

function SourcesSection({ sources }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-gray-500 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <BookMarked className="h-3.5 w-3.5 shrink-0" />
        <span>{t("studyChat.textbookSources")} ({sources.length})</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {sources.map((item, j) => (
            <SourceBlock key={item.id || j} item={item} index={j} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudyChat() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const [subject, setSubject] = useState("");
  const [classGrade, setClassGrade] = useState("");
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const subjectOptions = useMemo(
    () => [
      { value: "", label: t("studyChat.selectSubject") },
      ...STUDY_SUBJECTS.map((s) => ({
        value: s.apiValue,
        label: t(s.labelKey),
      })),
    ],
    [t]
  );

  const inferredClass = useMemo(() => inferClassFromAuth(auth), [auth]);
  const needsClassPick = !inferredClass;

  useEffect(() => {
    if (inferredClass) setClassGrade(inferredClass);
  }, [inferredClass]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const effectiveClass = inferredClass || classGrade;
  const canStart = Boolean(subject && effectiveClass);
  const classSelectOptions = useMemo(
    () => [
      { value: "", label: t("studyChat.selectClass") },
      ...CLASS_NUMBERS.map((c) => ({
        value: c,
        label: t("studyChat.classNumber", { n: c }),
      })),
    ],
    [t]
  );

  const handleStart = useCallback(() => {
    if (!canStart) return;
    setStarted(true);
  }, [canStart]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || sending || !subject || !effectiveClass) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setSending(true);

    try {
      const payload = await ragAsk({
        question: q,
        class: effectiveClass,
        subject,
        top_k: 5,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          answer: payload.answer,
          sources: payload.sources,
          diagram: payload.diagram,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          error: e?.message || t("studyChat.errorGeneric"),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const resetSession = () => {
    setStarted(false);
    setMessages([]);
    setInput("");
  };

  if (!started) {
    return (
      <div className="min-h-full overflow-y-auto bg-[var(--color-background)] px-4 py-8 pb-28 md:pb-10 flex flex-col items-center justify-start md:justify-center">
        <div className="w-full max-w-lg">
          {/* Hero */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/30">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("studyChat.title")}</h1>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{t("studyChat.subtitle")}</p>
          </div>

          {/* Subject grid */}
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-300">
            {t("studyChat.subject")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
            {STUDY_SUBJECTS.map((s) => {
              const meta = SUBJECT_META[s.apiValue] || DEFAULT_META;
              const { Icon } = meta;
              const isSelected = subject === s.apiValue;
              return (
                <button
                  key={s.apiValue}
                  type="button"
                  onClick={() => setSubject(s.apiValue)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-all duration-150 ${
                    isSelected
                      ? `${meta.bg} ${meta.border} ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-gray-900`
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                    <Icon className={`h-4 w-4 ${meta.icon}`} />
                  </span>
                  <span className={`text-sm font-medium leading-tight ${isSelected ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}>
                    {t(s.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Class selection */}
          {needsClassPick && (
            <div className="mb-6">
              <Select
                label={t("studyChat.class")}
                value={classGrade}
                onChange={(e) => setClassGrade(e.target.value)}
                options={classSelectOptions}
              />
            </div>
          )}
          {!needsClassPick && inferredClass && (
            <p className="mb-6 text-center text-xs text-gray-400 dark:text-gray-500">
              {t("studyChat.usingClassFromProfile", { class: inferredClass })}
            </p>
          )}

          <Button variant="primary" className="w-full" disabled={!canStart} onClick={handleStart}>
            {t("studyChat.continue")}
          </Button>
        </div>
      </div>
    );
  }

  const subjectMeta = SUBJECT_META[subject] || DEFAULT_META;
  const SubjectIcon = subjectMeta.Icon;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-3.5rem)] flex-col bg-[var(--color-background)] pb-16 md:pb-0">
      <header className="flex-shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={resetSession}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10 transition-colors"
            aria-label={t("studyChat.changeSubject")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${subjectMeta.bg} border ${subjectMeta.border}`}>
            <SubjectIcon className={`h-4.5 w-4.5 ${subjectMeta.icon}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">{subject}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
              {t("studyChat.headerSubtitle", { class: effectiveClass, suffix: t("studyChat.textbookQa") })}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 pb-nav md:pb-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-5 py-10 text-center">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${subjectMeta.bg} ${subjectMeta.border}`}>
                <SubjectIcon className={`h-7 w-7 ${subjectMeta.icon}`} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{subject}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("studyChat.emptyStateHint", { subject })}
                </p>
              </div>
              {SUGGESTED_QUESTIONS[subject] && (
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_QUESTIONS[subject].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary-600 px-4 py-2.5 text-sm text-white">
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
                          {m.diagram && <DiagramBlock diagram={m.diagram} />}
                          {m.sources?.length > 0 && (
                            <SourcesSection sources={m.sources} />
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
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-sm">
                <Sparkles className="h-4 w-4 shrink-0 text-primary-500" style={{ animation: "spin 2s linear infinite" }} />
                <div className="flex items-end gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-2.5 w-2.5 rounded-full bg-primary-500 animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">{t("studyChat.preparingAnswer")}</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 md:px-4 md:py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 shadow-sm transition-all focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t("studyChat.placeholderAsk")}
              className="flex-1 resize-none bg-transparent py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100"
              style={{ minHeight: "28px", maxHeight: "128px" }}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              aria-label={t("studyChat.sendAria")}
              className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[11px] text-gray-400 dark:text-gray-600">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
