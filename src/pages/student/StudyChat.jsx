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
import { Sparkles, SendHorizontal, BookMarked, ChevronLeft } from "lucide-react";

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
  const pct = formatMatchPct(item.similarity);
  const isQuestion = String(item.id || "").startsWith("question_");
  const locationParts = [
    item.chapter_title,
    item.section_title,
    item.subsection_title,
  ].filter(Boolean);

  return (
    <article
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary-100 px-2 text-[11px] font-semibold text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
          {index + 1}
        </span>
        {pct != null && (
          <span title={t("studyChat.matchScoreTitle")}>
            {t("studyChat.matchPercent", { pct })}
          </span>
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
      <div className="min-h-full bg-[var(--color-background)] p-4 md:p-8 pb-24 md:pb-8 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md p-6 md:p-8 space-y-6">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
              <Sparkles className="h-7 w-7" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {t("studyChat.title")}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("studyChat.subtitle")}
            </p>
          </div>
          <Select
            label={t("studyChat.subject")}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            options={subjectOptions}
          />
          {needsClassPick && (
            <Select
              label={t("studyChat.class")}
              value={classGrade}
              onChange={(e) => setClassGrade(e.target.value)}
              options={classSelectOptions}
            />
          )}
          {!needsClassPick && inferredClass && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("studyChat.usingClassFromProfile", { class: inferredClass })}
            </p>
          )}
          <Button
            variant="primary"
            className="w-full"
            disabled={!canStart}
            onClick={handleStart}
          >
            {t("studyChat.continue")}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-3.5rem)] flex-col bg-[var(--color-background)] pb-16 md:pb-0">
      <header className="flex-shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={resetSession}
            className="rounded-lg p-2 text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
            aria-label={t("studyChat.changeSubject")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <BookMarked className="h-5 w-5 text-primary-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {subject}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("studyChat.headerSubtitle", {
                class: effectiveClass,
                suffix: t("studyChat.textbookQa"),
              })}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 pb-nav md:pb-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-gray-600 dark:text-gray-400">
              {t("studyChat.emptyStateHint", { subject })}
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
                            <div className="space-y-2">
                              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {t("studyChat.textbookSources")}
                              </p>
                              <div className="space-y-3">
                                {m.sources.map((item, j) => (
                                  <SourceBlock
                                    key={item.id || j}
                                    item={item}
                                    index={j}
                                  />
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
            placeholder={t("studyChat.placeholderAsk")}
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
