import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth.store";
import { fetchStudentProfile } from "../../api/auth.api";
import { listLessonPlans, normalizeLessonPlanList } from "../../api/lessonPlans.api";
import { ChevronRight } from "lucide-react";
import Loader from "../../ui-components/Loader";

function studentSectionId(auth) {
  return (
    auth.details?.student_section_id ||
    auth.details?.sections?.[0]?.value ||
    auth.sections?.[0]?.value ||
    ""
  );
}

function normalizeSubjectEntry(s) {
  if (!s) return null;
  if (typeof s === "string") return { subject_id: s, subject_name: s };
  const id = s.subject_id || s.id;
  if (!id) return null;
  return {
    subject_id: id,
    subject_name: s.subject_name || s.name || s.label || id,
  };
}

const SUBJECT_COLORS = [
  { bg: "bg-teal-50", border: "border-l-teal-400", icon: "text-teal-500" },
  { bg: "bg-indigo-50", border: "border-l-indigo-400", icon: "text-indigo-500" },
  { bg: "bg-rose-50", border: "border-l-rose-400", icon: "text-rose-500" },
  { bg: "bg-amber-50", border: "border-l-amber-400", icon: "text-amber-500" },
  { bg: "bg-emerald-50", border: "border-l-emerald-400", icon: "text-emerald-500" },
  { bg: "bg-sky-50", border: "border-l-sky-400", icon: "text-sky-500" },
];

export default function StudentLessonPlansHome() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sectionId = useMemo(() => studentSectionId(auth), [auth]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      const map = new Map();

      try {
        try {
          const rawProfile = await fetchStudentProfile(auth.userId);
          const data = rawProfile?.data ?? rawProfile;
          const fromProfile =
            data?.subjects || data?.details?.subjects || data?.extras?.subjects;
          if (Array.isArray(fromProfile)) {
            for (const s of fromProfile) {
              const n = normalizeSubjectEntry(s);
              if (n) map.set(n.subject_id, n);
            }
          }
        } catch (e) {
          console.warn("Student profile subjects unavailable", e);
        }

        const campusId = auth.campus_id;
        if (sectionId && campusId) {
          try {
            const rawPlans = await listLessonPlans({
              campus_id: campusId,
              section_id: sectionId,
              limit: 200,
            });
            const plans = normalizeLessonPlanList(rawPlans);
            for (const p of plans) {
              const sid = p.subject_id;
              const name = p.subject_name || sid;
              if (sid) map.set(sid, { subject_id: sid, subject_name: name || sid });
              else if (name) map.set(name, { subject_id: name, subject_name: name });
            }
          } catch (e) {
            console.warn("Lesson plans list for subjects failed", e);
          }
        }

        if (cancelled) return;

        const list = [...map.values()].sort((a, b) =>
          a.subject_name.localeCompare(b.subject_name)
        );
        setSubjects(list);
        if (list.length === 0) {
          setError(
            sectionId
              ? null
              : "Your section is not set on your profile, so subjects could not be loaded."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (auth.userId) run();
    else setLoading(false);

    return () => { cancelled = true; };
  }, [auth.userId, auth.campus_id, sectionId]);

  useEffect(() => {
    if (!loading && subjects.length === 1) {
      navigate(`/student/lesson-plans/subject/${subjects[0].subject_id}`, { replace: true });
    }
  }, [loading, subjects, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (subjects.length === 1) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <h1 className="text-xl font-bold text-gray-900">Lesson Plans</h1>
        <div className="mt-8 text-center">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No subjects found</p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            {error || "Subjects appear here when teachers publish lesson plans for your class."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Lesson Plans</h1>
        <p className="mt-1 text-sm text-gray-500">Choose a subject to see planned lessons.</p>
      </div>
      <div className="space-y-2">
        {subjects.map((s, idx) => {
          const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
          return (
            <div
              key={s.subject_id}
              onClick={() => navigate(`/student/lesson-plans/subject/${s.subject_id}`)}
              className={`bg-white rounded-xl border border-gray-200 border-l-4 ${color.border} cursor-pointer hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150 overflow-hidden`}
            >
              <div className="flex items-center gap-4 px-4 py-3.5">
                <div className={`w-9 h-9 rounded-lg ${color.bg} flex items-center justify-center flex-shrink-0`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${color.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <span className="flex-1 font-semibold text-gray-900">{s.subject_name}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
