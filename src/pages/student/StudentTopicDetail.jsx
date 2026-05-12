import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getClassPlanById } from "../../api/lessonPlans.api";
import { useAuth } from "../../store/auth.store";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Zap,
  MinusCircle,
  ClipboardList,
  FileText,
  BookmarkCheck,
  StickyNote,
} from "lucide-react";
import { TopicDetailShimmer } from "../../ui-components/Shimmer";

function formatDate(d, locale) {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d);
  return x.toLocaleDateString(locale || undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function topicStatusConfig(status, t) {
  switch (status) {
    case "COMPLETED":
      return {
        Icon: CheckCircle2,
        iconColor: "text-green-500",
        badge: "bg-green-100 text-green-700",
        headerGradient: "from-green-500 to-emerald-600",
        label: t("staffTopicDetail.topicStatusCompleted"),
      };
    case "IN_PROGRESS":
      return {
        Icon: Zap,
        iconColor: "text-blue-500",
        badge: "bg-blue-100 text-blue-700",
        headerGradient: "from-blue-500 to-indigo-600",
        label: t("staffTopicDetail.topicStatusInProgress"),
      };
    case "SKIPPED":
      return {
        Icon: MinusCircle,
        iconColor: "text-gray-400",
        badge: "bg-gray-100 text-gray-500",
        headerGradient: "from-gray-400 to-gray-500",
        label: t("staffTopicDetail.topicStatusSkipped"),
      };
    default:
      return {
        Icon: Clock,
        iconColor: "text-amber-400",
        badge: "bg-amber-100 text-amber-700",
        headerGradient: "from-indigo-500 to-violet-600",
        label: t("staffTopicDetail.topicStatusUpcoming"),
      };
  }
}

export default function StudentTopicDetail() {
  const { t, i18n } = useTranslation();
  const { subjectId, topicId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { auth } = useAuth();

  const [topic, setTopic] = useState(state?.topic ?? null);
  const [loading, setLoading] = useState(!!state?.classPlanId);
  const [error, setError] = useState(null);

  useEffect(() => {
    const classPlanId = state?.classPlanId;
    if (!classPlanId || !topicId) {
      if (!state?.topic) {
        setError(t("studentTopicDetail.topicDataUnavailable"));
      }
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const sid = auth.sections?.section_id;
        const plan = await getClassPlanById(classPlanId, sid ? { section_id: sid } : {});
        const found = (plan?.topics ?? []).find(
          (t) => String(t.id ?? t.class_plan_topic_id) === String(topicId)
        );
        if (!cancelled) {
          if (found) setTopic(found);
          else if (!state?.topic) setError(t("studentTopicDetail.topicNotFound"));
        }
      } catch (e) {
        if (!cancelled && !state?.topic) setError(e?.message || t("studentTopicDetail.failedLoadTopic"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [topicId, state?.classPlanId, state?.topic, auth.sections?.section_id, t]);

  const goBack = () => navigate(`/student/lesson-plans/subject/${subjectId}`);

  if (loading && !topic) {
    return <TopicDetailShimmer />;
  }

  if (error || !topic) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-gray-50 overflow-hidden">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-base font-bold text-gray-900">{t("studentTopicDetail.fallbackTitle")}</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-4">{error || t("studentTopicDetail.topicNotFound")}</p>
            <button onClick={goBack} className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
              {t("studentTopicDetail.goBack")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sc = topicStatusConfig(topic.status, t);
  const { Icon } = sc;
  const assignments = (topic.assignments ?? []).filter(
    (a) => !a.status || a.status === "PUBLISHED" || a.status === "CLOSED"
  );
  const quizzes = topic.quizzes ?? [];
  const materials = topic.materials ?? [];
  const chapterTitle = state?.chapterTitle ?? topic.chapter_title ?? "";
  const chapterNumber = state?.chapterNumber ?? topic.chapter_number;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{topic.title}</h1>
          {chapterTitle && (
            <p className="text-xs text-gray-500 truncate">
              {chapterNumber != null ? t("staffTopicDetail.chapterPrefix", { number: chapterNumber }) : ""}{chapterTitle}
            </p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${sc.badge}`}>
          {sc.label}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto p-4 pb-24 space-y-4">

          {/* Hero banner */}
          <div className={`bg-gradient-to-br ${sc.headerGradient} rounded-2xl p-5 text-white`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {chapterTitle && (
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-75 mb-1">
                    {chapterNumber != null ? t("staffTopicDetail.chapterDotTitle", { number: chapterNumber }) : ""}{chapterTitle}
                  </p>
                )}
                <h2 className="text-lg font-bold leading-snug">{topic.title}</h2>
              </div>
            </div>

            {/* Meta pills */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {topic.scheduled_date && (
                <div className="bg-white/15 rounded-xl p-2.5">
                  <p className="text-xs opacity-70 mb-0.5">{t("staffTopicDetail.scheduledLabel")}</p>
                  <p className="text-sm font-semibold">{formatDate(topic.scheduled_date, i18n.language)}</p>
                </div>
              )}
              {topic.completed_on && (
                <div className="bg-white/15 rounded-xl p-2.5">
                  <p className="text-xs opacity-70 mb-0.5">{t("staffTopicDetail.completedLabel")}</p>
                  <p className="text-sm font-semibold">{formatDate(topic.completed_on, i18n.language)}</p>
                </div>
              )}
              {topic.actual_duration_mins != null && (
                <div className="bg-white/15 rounded-xl p-2.5">
                  <p className="text-xs opacity-70 mb-0.5">{t("studentTopicDetail.durationLabel")}</p>
                  <p className="text-sm font-semibold">{t("studentTopicDetail.durationMinutes", { count: topic.actual_duration_mins })}</p>
                </div>
              )}
            </div>

            {/* Resource counts */}
            {(assignments.length > 0 || quizzes.length > 0 || materials.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {assignments.length > 0 && (
                  <span className="text-xs bg-white/20 rounded-full px-3 py-1 font-medium">
                    {t("studentTopicDetail.assignmentCount", { count: assignments.length })}
                  </span>
                )}
                {quizzes.length > 0 && (
                  <span className="text-xs bg-white/20 rounded-full px-3 py-1 font-medium">
                    {t("studentTopicDetail.quizCount", { count: quizzes.length })}
                  </span>
                )}
                {materials.length > 0 && (
                  <span className="text-xs bg-white/20 rounded-full px-3 py-1 font-medium">
                    {t("studentTopicDetail.materialCount", { count: materials.length })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Teacher notes */}
          {topic.teacher_notes && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <StickyNote className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("studentTopicDetail.teacherNotes")}</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{topic.teacher_notes}</p>
            </div>
          )}

          {/* Assignments */}
          {assignments.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <ClipboardList className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t("staffTopicDetail.assignments")}
                </h3>
              </div>
              <div className="space-y-2">
                {assignments.map((a, i) => (
                  <a
                    key={i}
                    href={a.file_url || undefined}
                    target={a.file_url ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl border border-amber-100 bg-amber-50 ${a.file_url ? "hover:bg-amber-100 cursor-pointer" : "cursor-default"} transition-colors`}
                    onClick={!a.file_url ? (e) => e.preventDefault() : undefined}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="h-4 w-4 text-amber-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.title || t("studentTopicDetail.assignmentFallback", { index: i + 1 })}</p>
                      {a.due_date && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {t("staffTopicDetail.duePrefix")} {formatDate(a.due_date, i18n.language)}
                        </p>
                      )}
                    </div>
                    {a.file_url && (
                      <svg className="h-4 w-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Quizzes */}
          {quizzes.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t("staffTopicDetail.quizzes")}
                </h3>
              </div>
              <div className="space-y-2">
                {quizzes.map((q, i) => (
                  <a
                    key={i}
                    href={q.file_url || undefined}
                    target={q.file_url ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl border border-violet-100 bg-violet-50 ${q.file_url ? "hover:bg-violet-100 cursor-pointer" : "cursor-default"} transition-colors`}
                    onClick={!q.file_url ? (e) => e.preventDefault() : undefined}
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-200 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4 text-violet-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{q.title || t("studentTopicDetail.quizFallback", { index: i + 1 })}</p>
                      {q.generated_by_ai && (
                        <p className="text-xs text-violet-500 mt-0.5">{t("studentTopicDetail.aiGenerated")}</p>
                      )}
                    </div>
                    {q.file_url && (
                      <svg className="h-4 w-4 text-violet-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Study Materials */}
          {materials.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t("staffTopicDetail.studyMaterials")}
                </h3>
              </div>
              <div className="space-y-2">
                {materials.map((m, i) => (
                  <a
                    key={i}
                    href={m.file_url || undefined}
                    target={m.file_url ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl border border-teal-100 bg-teal-50 ${m.file_url ? "hover:bg-teal-100 cursor-pointer" : "cursor-default"} transition-colors`}
                    onClick={!m.file_url ? (e) => e.preventDefault() : undefined}
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-200 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-teal-700" />
                    </div>
                    <p className="flex-1 text-sm font-medium text-gray-900 truncate min-w-0">
                      {m.file_name || t("studentTopicDetail.materialFallback", { index: i + 1 })}
                    </p>
                    {m.file_url && (
                      <svg className="h-4 w-4 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Empty resources state */}
          {assignments.length === 0 && quizzes.length === 0 && materials.length === 0 && !topic.teacher_notes && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookmarkCheck className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">{t("studentTopicDetail.emptyResources")}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
