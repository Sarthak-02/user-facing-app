import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../../ui-components";
import { useAuth } from "../../store/auth.store";
import { listLessonPlans, normalizeLessonPlanList } from "../../api/lessonPlans.api";
import { fetchStudentProfile } from "../../api/auth.api";
import { ArrowLeft } from "lucide-react";
import Loader from "../../ui-components/Loader";

function studentSectionId(auth) {
  return (
    auth.details?.student_section_id ||
    auth.details?.sections?.[0]?.value ||
    auth.sections?.[0]?.value ||
    ""
  );
}

function formatDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d);
  return x.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function statusConfig(status) {
  switch (status) {
    case "COMPLETED":
      return { variant: "success", label: "Completed", border: "border-l-green-400", bg: "bg-green-50", dot: "bg-green-400" };
    case "SKIPPED":
      return { variant: "warning", label: "Skipped", border: "border-l-amber-400", bg: "bg-amber-50", dot: "bg-amber-400" };
    case "PARTIALLY_COMPLETED":
      return { variant: "warning", label: "Partial", border: "border-l-amber-400", bg: "bg-amber-50", dot: "bg-amber-400" };
    default:
      return { variant: "info", label: "Scheduled", border: "border-l-teal-400", bg: "bg-teal-50", dot: "bg-teal-400" };
  }
}

function teacherDisplayName(teacher) {
  if (!teacher || typeof teacher !== "object") return "";
  const parts = [teacher.teacher_first_name, teacher.teacher_middle_name, teacher.teacher_last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return teacher.teacher_employee_code || teacher.teacher_id || "";
}

function truncateText(text, max) {
  if (!text || typeof text !== "string") return "";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

export default function StudentLessonPlansBrowse() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [subjectName, setSubjectName] = useState("");
  const [subjectCount, setSubjectCount] = useState(0);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const sectionId = useMemo(() => studentSectionId(auth), [auth]);

  const fetchSubjectMeta = useCallback(async () => {
    const map = new Map();
    try {
      const rawProfile = await fetchStudentProfile(auth.userId);
      const data = rawProfile?.data ?? rawProfile;
      const fromProfile = data?.subjects || data?.details?.subjects || data?.extras?.subjects;
      if (Array.isArray(fromProfile)) {
        for (const s of fromProfile) {
          const id = typeof s === "string" ? s : s.subject_id || s.id;
          if (!id) continue;
          const name = typeof s === "string" ? s : s.subject_name || s.name || id;
          map.set(id, name);
        }
      }
    } catch (_) { /* ignore */ }
    if (auth.campus_id && sectionId) {
      try {
        const rawPlans = await listLessonPlans({ campus_id: auth.campus_id, section_id: sectionId, limit: 200 });
        const list = normalizeLessonPlanList(rawPlans);
        for (const p of list) {
          const sid = p.subject;
          const name = p.subject_name || sid;
          if (sid) map.set(sid, name || sid);
          else if (name) map.set(name, name);
        }
      } catch (_) { /* ignore */ }
    }
    setSubjectCount(map.size);
    if (subjectId && map.has(subjectId)) setSubjectName(map.get(subjectId));
    else if (subjectId) setSubjectName(subjectId);
  }, [auth.userId, auth.campus_id, sectionId, subjectId]);

  const fetchPlans = useCallback(async () => {
    if (!subjectId || !auth.campus_id || !sectionId) {
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const raw = await listLessonPlans({
        campus_id: auth.campus_id,
        section_id: sectionId,
        subject: subjectId,
        limit: 200,
      });
      const list = normalizeLessonPlanList(raw);
      list.sort((a, b) => {
        const da = new Date(a.lesson_date ?? a.lessonDate ?? 0).getTime();
        const db = new Date(b.lesson_date ?? b.lessonDate ?? 0).getTime();
        return db - da;
      });
      setPlans(list);
    } catch (err) {
      console.error(err);
      setLoadError(err?.message || err?.error || "Failed to load lesson plans");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [subjectId, auth.campus_id, sectionId]);

  useEffect(() => { fetchSubjectMeta(); }, [fetchSubjectMeta]);
  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const goBack = () => {
    if (subjectCount > 1) navigate("/student/lesson-plans");
    else navigate("/home");
  };

  if (!subjectId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <p className="text-sm text-gray-600">Missing subject.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Sticky Header */}
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
            {subjectName || "Lesson Plans"}
          </h1>
          {!loading && (
            <p className="text-xs text-gray-500">
              {plans.length} {plans.length === 1 ? "lesson" : "lessons"}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        {!sectionId && (
          <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your section is not set; lesson plans may not load correctly.
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader />
          </div>
        ) : loadError ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-600">{loadError}</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">No lesson plans yet</p>
            <p className="text-xs text-gray-400">Lesson plans will appear here once your teacher publishes them.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto pb-8">
            {plans.map((p) => {
              const id = p.lesson_plan_id || p.id;
              const title = p.chapter_topic ?? p.chapterTopic ?? "Untitled";
              const dateVal = p.lesson_date ?? p.lessonDate;
              const teacher = teacherDisplayName(p.teacher);
              const desc = truncateText(p.description, 110);
              const cfg = statusConfig(p.status);
              const hasObjectives = Array.isArray(p.learning_objectives) && p.learning_objectives.length > 0;
              const hasActivities = Array.isArray(p.activities) && p.activities.length > 0;

              return (
                <div
                  key={id}
                  onClick={() => navigate(`/student/lesson-plans/subject/${subjectId}/plan/${id}`)}
                  className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.border} cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}
                >
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{title}</h3>
                        {teacher && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{teacher}</p>
                        )}
                      </div>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>

                    {desc && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{desc}</p>
                    )}

                    {/* Pill indicators */}
                    {(hasObjectives || hasActivities) && (
                      <div className="flex gap-2 mt-3">
                        {hasObjectives && (
                          <span className="text-xs bg-teal-50 text-teal-700 rounded-full px-2.5 py-0.5 font-medium">
                            {p.learning_objectives.length} objective{p.learning_objectives.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {hasActivities && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 rounded-full px-2.5 py-0.5 font-medium">
                            {p.activities.length} {p.activities.length === 1 ? "activity" : "activities"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={`px-4 py-2.5 ${cfg.bg} border-t border-gray-100 flex items-center justify-between`}>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${cfg.dot.replace("bg-", "text-")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{formatDate(dateVal)}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
