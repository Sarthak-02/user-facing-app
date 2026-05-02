import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Badge, Button } from "../../ui-components";
import Modal from "../../ui-components/Modal";
import { getHomeworkDetail, deleteHomework } from "../../api/homework.api";
import Loader from "../../ui-components/Loader";

function formatDate(date) {
  if (!date) return "";
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return formattedDate;
}


function StatusBadges({ status, dueDate }) {
  const { t } = useTranslation();
  const isPast = dueDate && new Date(dueDate) < new Date();
  const dueBadge = (status === "CLOSED" || isPast)
    ? <Badge variant="default">{t("staffHomeworkPage.badgeClosed")}</Badge>
    : <Badge variant="success">{t("staffHomeworkPage.badgeActive")}</Badge>;

  const pubBadge = status === "DRAFT"
    ? <Badge variant="warning">{t("staffHomeworkPage.badgeDraft")}</Badge>
    : <Badge variant="info">{t("staffHomeworkPage.badgePublished")}</Badge>;

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {pubBadge}
      {dueBadge}
    </div>
  );
}

export default function HomeworkDetail() {
  const { t } = useTranslation();
  const { homeworkId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [homework, setHomework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchHomeworkDetail = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getHomeworkDetail(homeworkId);
        
        setHomework(data);
      } catch (err) {
        console.error("Error fetching homework detail:", err);
        setError(err.message || t("staffHomeworkPage.fetchError"));
      } finally {
        setLoading(false);
      }
    };
    
    if (homeworkId) {
      fetchHomeworkDetail();
    }
  }, [homeworkId, t]);

  const handleGoBack = () => {
    navigate(location.state?.from || "/staff/homework");
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteHomework(homeworkId);
      navigate(location.state?.from || "/staff/homework", { replace: true });
    } catch (err) {
      console.error("Error deleting homework:", err);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const canDelete = homework?.status === "DRAFT";



  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !homework) {
    return (
      <div className="h-screen md:min-h-screen flex flex-col p-4 gap-6">
        <Card>
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-xl font-semibold">
                {error || t("staffHomeworkPage.notFound")}
              </h2>
            </div>
            <Button onClick={() => navigate(location.state?.from || "/staff/homework")}>
              {t("staffHomeworkPage.backToList")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }
 
  return (
    <div className="h-screen md:min-h-screen flex flex-col p-4 gap-6 pb-30 md:pb-6 overflow-y-auto">
      {/* Back Button */}
      <div>
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="font-medium">{t("staffHomeworkPage.backNav")}</span>
        </button>
      </div>

      {/* Header Card */}
      <Card>
        <div className="space-y-4">
          {/* Subject and Status */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {homework.subject}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                {homework.title}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadges status={homework.status} dueDate={homework.dueDate || homework.due_date} />
              {canDelete && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title={t("staffHomeworkPage.deleteHomeworkTitle")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-xs text-gray-500 mb-1">{t("staffHomeworkPage.targetSections")}</div>
              <div className="text-sm font-medium text-gray-900">
                {homework.targets && homework.targets.length > 0
                  ? homework.targets.map(t => t.target_name || `${t.class_name} - ${t.section_name}`).join(", ")
                  : homework.class_name || t("common.na")}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t("staffHomeworkPage.createdBy")}</div>
              <div className="text-sm font-medium text-gray-900">
                {homework.teacher?.teacher_name || homework.teacher_name || homework.created_by || t("common.na")}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t("staffHomeworkPage.createdDate")}</div>
              <div className="text-sm font-medium text-gray-900">
                {formatDate(homework.createdAt || homework.created_at)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t("staffHomeworkPage.dueDate")}</div>
              <div className="text-sm font-medium text-gray-900">
                {formatDate(homework.dueDate || homework.due_date)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Description */}
      <Card title={t("staffHomeworkPage.description")}>
        <p className="text-gray-700 leading-relaxed">{homework.description}</p>
      </Card>

      {/* Instructions */}
      {homework.instructions && homework.instructions.length > 0 && (
        <Card title={t("staffHomeworkPage.instructions")}>
          <ul className="space-y-2">
            {homework.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-medium mt-0.5">
                  {index + 1}
                </span>
                <span className="text-gray-700">{instruction}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Attachments */}
      {homework.attachments && homework.attachments.length > 0 && (
        <Card title={t("staffHomeworkPage.attachments")}>
          <div className="space-y-2">
            {homework.attachments.map((attachment, index) => (
              <a
                key={attachment.id || index}
                href={attachment.fileUrl}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {attachment.fileName}
                    </div>
                    <div className="text-xs text-gray-500">{attachment.fileSize}</div>
                  </div>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Submission Statistics */}
      {homework.submission_stats && (
        <Card title={t("staffHomeworkPage.submissionStatistics")}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {homework.submission_stats.total || 0}
              </div>
              <div className="text-sm text-blue-700 mt-1">{t("staffHomeworkPage.totalStudents")}</div>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {homework.submission_stats.submitted || 0}
              </div>
              <div className="text-sm text-green-700 mt-1">{t("staffHomeworkPage.submitted")}</div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {homework.submission_stats.pending || 0}
              </div>
              <div className="text-sm text-yellow-700 mt-1">{t("staffHomeworkPage.pending")}</div>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {homework.submission_stats.overdue || 0}
              </div>
              <div className="text-sm text-red-700 mt-1">{t("staffHomeworkPage.overdue")}</div>
            </div>
          </div>
        </Card>
      )}

      <Modal open={showDeleteModal} onClose={() => !deleting && setShowDeleteModal(false)}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{t("staffHomeworkPage.deleteTitle")}</h3>
              <p className="text-sm text-gray-500">{t("staffHomeworkPage.deleteWarning")}</p>
            </div>
          </div>

          <p className="text-sm text-gray-700">
            {t("staffHomeworkPage.deleteConfirm", { title: homework?.title })}
          </p>

          <div className="flex gap-3 justify-end pt-1">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("staffHomeworkPage.deleting") : t("common.delete")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
