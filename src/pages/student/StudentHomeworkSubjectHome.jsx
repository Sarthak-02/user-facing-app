import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui-components";
import { useAuth } from "../../store/auth.store";
import { fetchStudentProfile } from "../../api/auth.api";
import { getStudentHomeworkAll } from "../../api/homework.api";
import { ChevronRight } from "lucide-react";
import Loader from "../../ui-components/Loader";

/**
 * @param {unknown} s
 * @returns {{ subject_id: string, subject_name: string } | null}
 */
function normalizeSubjectEntry(s) {
  if (!s) return null;
  if (typeof s === "string") {
    return { subject_id: s, subject_name: s };
  }
  const id = s.subject_id || s.id;
  if (!id) return null;
  return {
    subject_id: id,
    subject_name: s.subject_name || s.name || s.label || id,
  };
}

export default function StudentHomeworkSubjectHome() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
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

        try {
          const response = await getStudentHomeworkAll({
            student_id: auth.userId,
            status: "PUBLISHED",
            limit: 100,
            offset: 0,
          });
          const list = response?.data || response || [];
          if (Array.isArray(list)) {
            for (const hw of list) {
              const subj = hw.subject;
              if (subj && typeof subj === "string") {
                map.set(subj, { subject_id: subj, subject_name: subj });
              }
            }
          }
        } catch (e) {
          console.warn("Student homework list for subjects failed", e);
        }

        if (cancelled) return;

        const list = [...map.values()].sort((a, b) =>
          a.subject_name.localeCompare(b.subject_name)
        );
        setSubjects(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (auth.userId) {
      run();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [auth.userId]);

  useEffect(() => {
    if (!loading && subjects.length === 1) {
      const enc = encodeURIComponent(subjects[0].subject_id);
      navigate(`/student/homework/subject/${enc}`, { replace: true });
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
        <h1 className="text-xl font-bold text-gray-900">Homework</h1>
        <p className="mt-3 text-sm text-gray-600">
          No subjects were found. Subjects appear here when they are on your profile or when teachers
          assign homework.
        </p>
      </div>
    );
  }

  const subjectColors = [
    { bg: "bg-blue-50", border: "border-l-blue-400", icon: "text-blue-500", text: "text-blue-700" },
    { bg: "bg-violet-50", border: "border-l-violet-400", icon: "text-violet-500", text: "text-violet-700" },
    { bg: "bg-emerald-50", border: "border-l-emerald-400", icon: "text-emerald-500", text: "text-emerald-700" },
    { bg: "bg-amber-50", border: "border-l-amber-400", icon: "text-amber-500", text: "text-amber-700" },
    { bg: "bg-rose-50", border: "border-l-rose-400", icon: "text-rose-500", text: "text-rose-700" },
    { bg: "bg-cyan-50", border: "border-l-cyan-400", icon: "text-cyan-500", text: "text-cyan-700" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
      <h1 className="text-xl font-bold text-gray-900">Homework</h1>
      <p className="mt-1 text-sm text-gray-500">Choose a subject to view your assignments.</p>
      <div className="mt-5 space-y-2">
        {subjects.map((s, idx) => {
          const color = subjectColors[idx % subjectColors.length];
          return (
            <div
              key={s.subject_id}
              onClick={() => {
                const enc = encodeURIComponent(s.subject_id);
                navigate(`/student/homework/subject/${enc}`);
              }}
              className={`bg-white rounded-xl border border-gray-200 border-l-4 ${color.border} cursor-pointer hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150 overflow-hidden`}
            >
              <div className="flex items-center gap-4 px-4 py-3.5">
                <div className={`w-9 h-9 rounded-lg ${color.bg} flex items-center justify-center flex-shrink-0`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${color.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
