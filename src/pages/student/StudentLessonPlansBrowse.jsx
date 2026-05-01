import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../store/auth.store";
import { listClassPlans, getClassPlanById } from "../../api/lessonPlans.api";
import { fetchStudentProfile } from "../../api/auth.api";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  MinusCircle,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import Loader from "../../ui-components/Loader";

function formatDate(d) {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d);
  return x.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function topicStatusConfig(status) {
  switch (status) {
    case "COMPLETED":
      return { Icon: CheckCircle2, color: "text-green-500", badge: "bg-green-100 text-green-700", label: "Completed" };
    case "IN_PROGRESS":
      return { Icon: Zap, color: "text-blue-500", badge: "bg-blue-100 text-blue-700", label: "In Progress" };
    case "SKIPPED":
      return { Icon: MinusCircle, color: "text-gray-400", badge: "bg-gray-100 text-gray-400", label: "Skipped" };
    default:
      return { Icon: Clock, color: "text-amber-400", badge: "bg-amber-100 text-amber-700", label: "Upcoming" };
  }
}

function groupTopicsByChapter(topics) {
  const map = new Map();
  const ordered = [];
  for (const t of topics ?? []) {
    const key = t.chapter_title || "General";
    if (!map.has(key)) {
      const chapter = { title: key, number: t.chapter_number, topics: [] };
      map.set(key, chapter);
      ordered.push(chapter);
    }
    map.get(key).topics.push(t);
  }
  for (const ch of ordered) {
    ch.topics.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }
  return ordered;
}

export default function StudentLessonPlansBrowse() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [subjectName, setSubjectName] = useState("");
  const [subjectCount, setSubjectCount] = useState(0);
  const [classPlan, setClassPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState({});

  const load = useCallback(async () => {
    if (!subjectId || !auth.campus_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);

    try {
      // Resolve subject name from student profile
      let resolvedName = subjectId;
      const subjectMap = new Map();
      try {
        const rawProfile = await fetchStudentProfile(auth.userId);
        const data = rawProfile?.data ?? rawProfile;
        const fromProfile = data?.subjects || data?.details?.subjects || data?.extras?.subjects;
        if (Array.isArray(fromProfile)) {
          for (const s of fromProfile) {
            const id = typeof s === "string" ? s : s.subject_id || s.id;
            const name = typeof s === "string" ? s : s.subject_name || s.name || id;
            if (id) subjectMap.set(id, name);
          }
        }
      } catch (_) {}
      setSubjectCount(subjectMap.size);
      if (subjectMap.has(subjectId)) resolvedName = subjectMap.get(subjectId);
      setSubjectName(resolvedName);

      // Fetch the class plan (curriculum) for this subject
      const allPlans = await listClassPlans({
        campus_id: auth.campus_id,
        is_published: true,
        limit: 100,
      });
      const match = allPlans.find(
        (p) =>
          p.subject === subjectId ||
          p.subject === resolvedName ||
          (p.subject && resolvedName && p.subject.toLowerCase() === resolvedName.toLowerCase())
      );
      if (match) {
        const planId = match.id ?? match.class_plan_id;
        const full = await getClassPlanById(planId);
        setClassPlan(full);
        // Use class plan's subject as the display name if we don't have a better one
        if (resolvedName === subjectId && match.subject) setSubjectName(match.subject);
      }
    } catch (err) {
      setLoadError(err?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [subjectId, auth.campus_id, auth.userId]);

  useEffect(() => { load(); }, [load]);

  // Auto-expand the first chapter
  useEffect(() => {
    if (!classPlan?.topics?.length) return;
    const chapters = groupTopicsByChapter(classPlan.topics);
    if (chapters.length > 0) {
      setExpandedChapters({ [chapters[0].title]: true });
    }
  }, [classPlan]);

  const chapters = useMemo(
    () => (classPlan?.topics ? groupTopicsByChapter(classPlan.topics) : []),
    [classPlan]
  );

  const toggleChapter = (title) =>
    setExpandedChapters((p) => ({ ...p, [title]: !p[title] }));

  const goBack = () => {
    if (subjectCount > 1) navigate("/student/lesson-plans");
    else navigate("/home");
  };

  const totalTopics = classPlan?.topics?.length ?? 0;
  const completedTopics = (classPlan?.topics ?? []).filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
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
          <h1 className="text-base font-bold text-gray-900 truncate">
            {subjectName || subjectId}
          </h1>
          {!loading && chapters.length > 0 && (
            <p className="text-xs text-gray-500">
              {chapters.length} chapter{chapters.length !== 1 ? "s" : ""} · {totalTopics} topic{totalTopics !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3">
              <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-500">{loadError}</p>
          </div>
        ) : chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-indigo-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No content yet</p>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              Your teacher hasn&apos;t published lessons for this subject yet.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto p-4 pb-10 space-y-5">

            {/* Progress bar (only if class plan exists) */}
            {chapters.length > 0 && totalTopics > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</p>
                  <p className="text-xs font-semibold text-indigo-600">
                    {completedTopics}/{totalTopics} topics completed
                  </p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((completedTopics / totalTopics) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Curriculum section */}
            {chapters.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-0.5">
                  Curriculum
                </p>
                <div className="space-y-2.5">
                  {chapters.map((chapter, chIdx) => {
                    const isOpen = !!expandedChapters[chapter.title];
                    const total = chapter.topics.length;
                    const done = chapter.topics.filter((t) => t.status === "COMPLETED").length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                    return (
                      <div key={chapter.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleChapter(chapter.title)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-indigo-700">
                              {chapter.number ?? chIdx + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{chapter.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                                <div
                                  className="h-full bg-indigo-400 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">{done}/{total}</span>
                            </div>
                          </div>
                          {isOpen
                            ? <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            : <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                        </button>

                        {isOpen && (
                          <div className="border-t border-gray-100 divide-y divide-gray-50">
                            {chapter.topics.map((topic) => {
                              const tid = topic.id ?? topic.class_plan_topic_id;
                              const sc = topicStatusConfig(topic.status);
                              const { Icon } = sc;
                              const assignments = topic.assignments ?? [];
                              const quizzes = topic.quizzes ?? [];
                              const materials = topic.materials ?? [];
                              const resourceCount = assignments.length + quizzes.length + materials.length;
                              const isSkipped = topic.status === "SKIPPED";
                              const planId = classPlan?.id ?? classPlan?.class_plan_id;

                              return (
                                <button
                                  key={tid}
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/student/lesson-plans/subject/${subjectId}/topic/${tid}`,
                                      {
                                        state: {
                                          topic,
                                          chapterTitle: chapter.title,
                                          chapterNumber: chapter.number,
                                          classPlanId: planId,
                                        },
                                      }
                                    )
                                  }
                                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                >
                                  <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${sc.color}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${isSkipped ? "line-through text-gray-400" : "text-gray-900"}`}>
                                      {topic.title}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.badge}`}>
                                        {sc.label}
                                      </span>
                                      {topic.scheduled_date && (
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                          <Calendar className="h-3 w-3" />
                                          {formatDate(topic.scheduled_date)}
                                        </span>
                                      )}
                                      {resourceCount > 0 && (
                                        <span className="text-xs text-gray-400">
                                          {[
                                            assignments.length && `${assignments.length} task${assignments.length > 1 ? "s" : ""}`,
                                            quizzes.length && `${quizzes.length} quiz${quizzes.length > 1 ? "zes" : ""}`,
                                            materials.length && `${materials.length} file${materials.length > 1 ? "s" : ""}`,
                                          ].filter(Boolean).join(" · ")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
