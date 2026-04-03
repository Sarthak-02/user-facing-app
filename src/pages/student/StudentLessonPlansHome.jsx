import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui-components";
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
              if (!p.subject_id) continue;
              const name = p.subject_name || p.subject?.name || p.subject_id;
              map.set(p.subject_id, { subject_id: p.subject_id, subject_name: name });
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

    if (auth.userId) {
      run();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
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
        <h1 className="text-xl font-bold text-gray-900">Lesson plans</h1>
        <p className="mt-3 text-sm text-gray-600">
          {error ||
            "No subjects were found. Subjects appear here when they are on your profile or when teachers publish lesson plans for your class."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
      <h1 className="text-xl font-bold text-gray-900">Lesson plans</h1>
      <p className="mt-1 text-sm text-gray-600">Choose a subject to see planned lessons.</p>
      <div className="mt-6 space-y-2">
        {subjects.map((s) => (
          <Card
            key={s.subject_id}
            className="cursor-pointer transition hover:border-primary-300"
            onClick={() => navigate(`/student/lesson-plans/subject/${s.subject_id}`)}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-gray-900">{s.subject_name}</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
