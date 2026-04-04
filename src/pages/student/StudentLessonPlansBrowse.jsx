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

function teacherDisplayName(teacher) {
  if (!teacher || typeof teacher !== "object") return "";
  const parts = [
    teacher.teacher_first_name,
    teacher.teacher_middle_name,
    teacher.teacher_last_name,
  ].filter(Boolean);
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
          const sid = p.subject;
          const name = p.subject_name || sid;
          if (sid) map.set(sid, name || sid);
          else if (name) map.set(name, name);
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
            const title = p.chapter_topic ?? p.chapterTopic ?? "Untitled";
            const dateVal = p.lesson_date ?? p.lessonDate;
            const teacher = teacherDisplayName(p.teacher);
            const desc = truncateText(p.description, 120);
            return (
              <Card key={id}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => navigate(`/student/lesson-plans/subject/${subjectId}/plan/${id}`)}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{title}</p>
                      <p className="mt-1 text-sm text-gray-600">{formatDate(dateVal)}</p>
                      {teacher ? (
                        <p className="mt-0.5 text-xs text-gray-500">Teacher: {teacher}</p>
                      ) : null}
                      {desc ? (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{desc}</p>
                      ) : null}
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
