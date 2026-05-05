import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge, Button } from "../../ui-components";
import { getHomeworkDetail } from "../../api/homework.api";
import Loader from "../../ui-components/Loader";

function formatDate(date, locale) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(locale || undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function pickString(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return "";
}

function classSectionLabel(hw) {
  const classPart =
    pickString(hw?.class?.class_name) ||
    pickString(hw?.class_name) ||
    pickString(typeof hw?.class === "string" ? hw.class : "");
  const sectionPart =
    pickString(hw?.section?.section_name) ||
    pickString(hw?.section_name) ||
    pickString(typeof hw?.section === "string" ? hw.section : "");

  if (classPart && sectionPart) return `${classPart} · ${sectionPart}`;
  if (classPart) return classPart;
  if (sectionPart) return sectionPart;

  if (hw?.targets?.length) {
    return hw.targets
      .map((t) => t.target_name || [t.class_name, t.section_name].filter(Boolean).join(" · "))
      .filter(Boolean)
      .join(", ");
  }
  return "—";
}

function assignedByLabel(hw) {
  return (
    hw?.teacher?.teacher_name ||
    hw?.assignedBy ||
    hw?.teacher_name ||
    (typeof hw?.created_by === "string" ? hw.created_by : hw?.created_by?.name) ||
    "—"
  );
}

function assignedDateValue(hw) {
  return hw?.assignedDate || hw?.assigned_at || hw?.published_at || hw?.createdAt || hw?.created_at || "";
}

function getStatusConfig(status, dueDate, t) {
  const now = new Date();
  const due = dueDate ? new Date(dueDate) : null;
  if (status === "SUBMITTED") return { badge: "success", label: t("studentHomeworkDetail.statusSubmitted"), gradient: "from-green-500 to-emerald-600" };
  if (due && due < now) return { badge: "error", label: t("studentHomeworkDetail.statusOverdue"), gradient: "from-red-500 to-rose-600" };
  return { badge: "info", label: t("studentHomeworkDetail.statusAssigned"), gradient: "from-blue-500 to-indigo-600" };
}

function isDueSoon(dueDate) {
  if (!dueDate) return false;
  const diff = new Date(dueDate) - new Date();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
}

export default function HomeworkDetail() {
  const { homeworkId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const [homework, setHomework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeworkDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getHomeworkDetail(homeworkId);
        setHomework(data);
      } catch (err) {
        console.error("Error fetching homework detail:", err);
        setError(err.message || t("studentHomeworkDetail.fetchFailed"));
      } finally {
        setLoading(false);
      }
    };

    if (homeworkId) fetchHomeworkDetail();
  }, [homeworkId, t]);

  const handleGoBack = () => navigate(location.state?.from || "/student/homework");

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !homework) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-gray-50 overflow-hidden">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={handleGoBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-900">{t("studentHomeworkDetail.title")}</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-4">{error || t("studentHomeworkDetail.notFound")}</p>
            <Button onClick={handleGoBack}>{t("studentHomeworkDetail.backToHomework")}</Button>
          </div>
        </div>
      </div>
    );
  }

  const dueDate = homework.dueDate || homework.due_date;
  const cfg = getStatusConfig(homework.status, dueDate, t);
  const dueSoon = isDueSoon(dueDate);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50 overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={handleGoBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{homework.title}</h1>
          <p className="text-xs text-gray-500">{homework.subject}</p>
        </div>
        <Badge variant={cfg.badge}>{cfg.label}</Badge>
      </div>


      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto p-4 space-y-4 pb-8">

          {/* Hero Banner */}
          <div className={`bg-gradient-to-br ${cfg.gradient} rounded-xl p-5 text-white`}>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">
              {homework.subject}
            </p>
            <h2 className="text-xl font-bold leading-tight">{homework.title}</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-2.5">
                <p className="text-xs opacity-75 mb-0.5">{t("studentHomeworkDetail.classSection")}</p>
                <p className="text-sm font-semibold">{classSectionLabel(homework)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-2.5">
                <p className="text-xs opacity-75 mb-0.5">{t("studentHomeworkDetail.assignedBy")}</p>
                <p className="text-sm font-semibold truncate">{assignedByLabel(homework)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-2.5">
                <p className="text-xs opacity-75 mb-0.5">{t("studentHomeworkDetail.assigned")}</p>
                <p className="text-sm font-semibold">{formatDate(assignedDateValue(homework), i18n.language) || "—"}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${dueSoon ? "bg-amber-400/30" : "bg-white/15 backdrop-blur-sm"}`}>
                <p className="text-xs opacity-75 mb-0.5">{t("studentHomeworkDetail.dueDate")}</p>
                <p className="text-sm font-semibold">
                  {formatDate(dueDate, i18n.language) || "—"}
                  {dueSoon && <span className="ml-1 text-xs font-normal opacity-90">· {t("studentHomeworkDetail.soon")}</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {homework.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t("studentHomeworkDetail.description")}</h3>
              <p className="text-gray-700 leading-relaxed text-sm">{homework.description}</p>
            </div>
          )}

          {/* Instructions */}
          {homework.instructions && homework.instructions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t("studentHomeworkDetail.instructions")}</h3>
              <ol className="space-y-2">
                {homework.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-relaxed">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Attachments */}
          {homework.attachments && homework.attachments.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {t("studentHomeworkDetail.attachments", { count: homework.attachments.length })}
              </h3>
              <div className="space-y-2">
                {homework.attachments.map((attachment, index) => (
                  <a
                    key={attachment.id || index}
                    href={attachment.fileUrl}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-100 transition-colors group"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{attachment.fileName}</div>
                        {attachment.fileSize && <div className="text-xs text-gray-400">{attachment.fileSize}</div>}
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
