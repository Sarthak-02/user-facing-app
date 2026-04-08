import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../../ui-components";
import { getLessonPlanById } from "../../api/lessonPlans.api";
import { ArrowLeft } from "lucide-react";
import Loader from "../../ui-components/Loader";

function formatDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d);
  return x.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function statusConfig(status) {
  switch (status) {
    case "COMPLETED":
      return {
        variant: "success",
        label: "Completed",
        gradient: "from-green-500 to-emerald-600",
      };
    case "SKIPPED":
      return {
        variant: "warning",
        label: "Skipped",
        gradient: "from-amber-500 to-orange-500",
      };
    case "PARTIALLY_COMPLETED":
      return {
        variant: "warning",
        label: "Partially Completed",
        gradient: "from-amber-500 to-yellow-500",
      };
    default:
      return {
        variant: "info",
        label: "Scheduled",
        gradient: "from-teal-500 to-cyan-600",
      };
  }
}

function teacherDisplayName(teacher) {
  if (!teacher || typeof teacher !== "object") return "";
  const parts = [teacher.teacher_first_name, teacher.teacher_middle_name, teacher.teacher_last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return teacher.teacher_employee_code || teacher.teacher_id || "";
}

function classSectionLabel(p) {
  const c = p.class_name ?? p.class?.class_name;
  const s = p.section_name ?? p.section?.section_name;
  if (c && s) return `${c} · ${s}`;
  return s || c || "";
}

const ACTIVITY_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-100", label: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  { bg: "bg-violet-50", border: "border-violet-100", label: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
  { bg: "bg-teal-50", border: "border-teal-100", label: "text-teal-700", badge: "bg-teal-100 text-teal-700" },
  { bg: "bg-rose-50", border: "border-rose-100", label: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
  { bg: "bg-amber-50", border: "border-amber-100", label: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
];

export default function StudentLessonPlanDetail() {
  const { subjectId, planId } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!planId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLessonPlanById(planId);
        if (!cancelled) setPlan(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message || err?.error || "Failed to load lesson plan");
          setPlan(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [planId]);

  const goBack = () => navigate(`/student/lesson-plans/subject/${subjectId}`);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-base font-bold text-gray-900">Lesson Plan</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-4">{error || "Lesson plan not found."}</p>
            <button onClick={goBack} className="px-4 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const objectives = plan.learning_objectives || [];
  const activities = plan.activities || [];
  const attachments = plan.attachments || plan.lesson_plan_attachments || [];
  const classSection = classSectionLabel(plan);
  const teacherName = teacherDisplayName(plan.teacher);
  const cfg = statusConfig(plan.status);
  const title = plan.chapter_topic ?? plan.chapterTopic ?? "Lesson Plan";

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{title}</h1>
          {plan.subject_name && <p className="text-xs text-gray-500">{plan.subject_name}</p>}
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto p-4 space-y-4 pb-8">

          {/* Hero Banner */}
          <div className={`bg-gradient-to-br ${cfg.gradient} rounded-xl p-5 text-white`}>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">
              {plan.subject_name || "Lesson Plan"}
            </p>
            <h2 className="text-xl font-bold leading-tight">{title}</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-2.5">
                <p className="text-xs opacity-75 mb-0.5">Date</p>
                <p className="text-sm font-semibold">{formatDate(plan.lesson_date ?? plan.lessonDate)}</p>
              </div>
              {classSection && (
                <div className="bg-white/15 backdrop-blur-sm rounded-lg p-2.5">
                  <p className="text-xs opacity-75 mb-0.5">Class / Section</p>
                  <p className="text-sm font-semibold">{classSection}</p>
                </div>
              )}
              {teacherName && (
                <div className="bg-white/15 backdrop-blur-sm rounded-lg p-2.5">
                  <p className="text-xs opacity-75 mb-0.5">Teacher</p>
                  <p className="text-sm font-semibold truncate">{teacherName}</p>
                </div>
              )}
            </div>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {objectives.length > 0 && (
                <span className="text-xs bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 font-medium">
                  {objectives.length} {objectives.length === 1 ? "objective" : "objectives"}
                </span>
              )}
              {activities.length > 0 && (
                <span className="text-xs bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 font-medium">
                  {activities.length} {activities.length === 1 ? "activity" : "activities"}
                </span>
              )}
              {attachments.length > 0 && (
                <span className="text-xs bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 font-medium">
                  {attachments.length} {attachments.length === 1 ? "attachment" : "attachments"}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {plan.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Description</h3>
              <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{plan.description}</p>
            </div>
          )}

          {/* Learning Objectives */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Learning Objectives
            </h3>
            {objectives.length > 0 ? (
              <ol className="space-y-2">
                {objectives.map((o, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs flex items-center justify-center font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-relaxed">{o}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-400">No objectives listed.</p>
            )}
          </div>

          {/* Activities */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Activities
            </h3>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((a, i) => {
                  const color = ACTIVITY_COLORS[i % ACTIVITY_COLORS.length];
                  const duration = a.duration_minutes ?? a.durationMinutes;
                  return (
                    <div key={i} className={`rounded-xl border ${color.border} ${color.bg} p-4`}>
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <p className={`text-sm font-semibold capitalize ${color.label}`}>
                          {a.type || `Activity ${i + 1}`}
                        </p>
                        {duration != null && (
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${color.badge}`}>
                            {duration} min
                          </span>
                        )}
                      </div>
                      {a.description && (
                        <p className="text-sm text-gray-600 leading-relaxed">{a.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No activities listed.</p>
            )}
          </div>

          {/* Homework */}
          {plan.homework && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Homework</h3>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{plan.homework}</p>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Attachments ({attachments.length})
              </h3>
              <div className="space-y-2">
                {attachments.map((a, i) => {
                  const url = a.fileUrl || a.file_url;
                  const name = a.fileName || a.file_name || `Attachment ${i + 1}`;
                  return (
                    <div key={a.attachment_id || a.id || i}>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-teal-50 hover:border-teal-100 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-800 truncate">{name}</span>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-teal-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-500">{name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
