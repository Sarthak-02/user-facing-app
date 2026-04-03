import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card } from "../../ui-components";
import { getLessonPlanById } from "../../api/lessonPlans.api";
import { ArrowLeft } from "lucide-react";
import Loader from "../../ui-components/Loader";

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
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const goBack = () => {
    navigate(`/student/lesson-plans/subject/${subjectId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
        <Button variant="ghost" className="mb-4 w-fit gap-2 px-0" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <p className="text-sm text-error-600">{error || "Lesson plan not found."}</p>
      </div>
    );
  }

  const objectives = plan.learning_objectives || [];
  const activities = plan.activities || [];
  const attachments = plan.attachments || plan.lesson_plan_attachments || [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
      <Button variant="ghost" className="mb-4 w-fit gap-2 px-0" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{plan.chapter_topic || "Lesson plan"}</h1>
          <p className="mt-1 text-sm text-gray-600">{formatDate(plan.lesson_date)}</p>
        </div>
        <Badge variant={statusVariant(plan.status)}>{statusLabel(plan.status)}</Badge>
      </div>

      <Card className="mt-6" title="Learning objectives">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-800">
          {objectives.length ? (
            objectives.map((o, i) => <li key={i}>{o}</li>)
          ) : (
            <li className="list-none pl-0 text-gray-500">None listed</li>
          )}
        </ol>
      </Card>

      <Card className="mt-4" title="Activities">
        <ul className="space-y-3 text-sm text-gray-800">
          {activities.length ? (
            activities.map((a, i) => (
              <li key={i} className="rounded-lg border border-border bg-surface/40 p-3">
                <p className="font-medium capitalize">{a.type || "Activity"}</p>
                {a.duration_minutes != null && (
                  <p className="mt-1 text-xs text-gray-600">{a.duration_minutes} minutes</p>
                )}
                {a.description && <p className="mt-2 text-gray-700">{a.description}</p>}
              </li>
            ))
          ) : (
            <li className="text-gray-500">None listed</li>
          )}
        </ul>
      </Card>

      {plan.homework ? (
        <Card className="mt-4" title="Homework">
          <p className="whitespace-pre-wrap text-sm text-gray-800">{plan.homework}</p>
        </Card>
      ) : null}

      {attachments.length > 0 ? (
        <Card className="mt-4" title="Attachments">
          <ul className="space-y-2 text-sm">
            {attachments.map((a, i) => {
              const url = a.fileUrl || a.file_url;
              const name = a.fileName || a.file_name || `Attachment ${i + 1}`;
              return (
                <li key={a.attachment_id || a.id || i}>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      {name}
                    </a>
                  ) : (
                    <span>{name}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
