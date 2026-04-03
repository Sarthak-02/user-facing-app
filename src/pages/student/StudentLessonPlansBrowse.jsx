import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card } from "../../ui-components";
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

function statusVariant(status) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "SKIPPED":
      return "warning";
    case "PARTIALLY_COMPLETED":
      return "warning";
    default:
      return "info";
  }
}

function statusLabel(status) {
  if (!status) return "";
  return String(status).replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
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
      const fromProfile =
        data?.subjects || data?.details?.subjects || data?.extras?.subjects;
      if (Array.isArray(fromProfile)) {
        for (const s of fromProfile) {
          const id = typeof s === "string" ? s : s.subject_id || s.id;
          if (!id) continue;
          const name = typeof s === "string" ? s : s.subject_name || s.name || id;
          map.set(id, name);
        }
      }
    } catch (_) {
      /* ignore */
    }
    if (auth.campus_id && sectionId) {
      try {
        const rawPlans = await listLessonPlans({
          campus_id: auth.campus_id,
          section_id: sectionId,
          limit: 200,
        });
        const list = normalizeLessonPlanList(rawPlans);
        for (const p of list) {
          if (!p.subject_id) continue;
          const name = p.subject_name || p.subject?.name || p.subject_id;
          map.set(p.subject_id, name);
        }
      } catch (_) {
        /* ignore */
      }
    }
    setSubjectCount(map.size);
    if (subjectId && map.has(subjectId)) {
      setSubjectName(map.get(subjectId));
    } else if (subjectId) {
      setSubjectName(subjectId);
    }
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
        subject_id: subjectId,
        limit: 200,
      });
      const list = normalizeLessonPlanList(raw);
      list.sort((a, b) => {
        const da = new Date(a.lesson_date || 0).getTime();
        const db = new Date(b.lesson_date || 0).getTime();
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

  useEffect(() => {
    fetchSubjectMeta();
  }, [fetchSubjectMeta]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const goBack = () => {
    if (subjectCount > 1) {
      navigate("/student/lesson-plans");
    } else {
      navigate("/home");
    }
  };

  if (!subjectId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <p className="text-sm text-gray-600">Missing subject.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
      <Button variant="ghost" className="mb-4 w-fit gap-2 px-0" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div>
        <h1 className="text-xl font-bold text-gray-900">{subjectName || "Subject"}</h1>
        <p className="mt-1 text-sm text-gray-600">Your lesson plans for this subject</p>
      </div>

      {!sectionId && (
        <p className="mt-4 text-sm text-amber-700">
          Your section is not set; lesson plans may not load correctly.
        </p>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader />
        </div>
      ) : loadError ? (
        <p className="mt-6 text-sm text-error-600">{loadError}</p>
      ) : plans.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-600">No lesson plans for this subject yet.</p>
      ) : (
        <div className="mt-6 space-y-2">
          {plans.map((p) => {
            const id = p.lesson_plan_id || p.id;
            return (
              <Card key={id}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => navigate(`/student/lesson-plans/subject/${subjectId}/plan/${id}`)}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{p.chapter_topic || "Untitled"}</p>
                      <p className="mt-1 text-sm text-gray-600">{formatDate(p.lesson_date)}</p>
                    </div>
                    <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
