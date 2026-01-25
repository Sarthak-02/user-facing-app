import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Badge, Button } from "../../ui-components";
import { getHomeworkDetail } from "../../api/homework.api";
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

function formatDateTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status, dueDate }) {
  const now = new Date();
  const due = new Date(dueDate);
  
  if (status === "DRAFT") {
    return <Badge variant="warning">Draft</Badge>;
  } else if (status === "CLOSED") {
    return <Badge variant="default">Closed</Badge>;
  } else if (due < now && status !== "CLOSED" && status !== "DRAFT") {
    return <Badge variant="error">Overdue</Badge>;
  } else if (status === "PUBLISHED" || status === "ACTIVE") {
    return <Badge variant="info">Active</Badge>;
  }
  return <Badge variant="default">{status}</Badge>;
}

export default function HomeworkDetail() {
  const { homeworkId } = useParams();
  const navigate = useNavigate();
  
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
        setError(err.message || "Failed to fetch homework details");
      } finally {
        setLoading(false);
      }
    };
    
    if (homeworkId) {
      fetchHomeworkDetail();
    }
  }, [homeworkId]);

  const handleGoBack = () => {
    navigate("/staff/homework");
  };

  const handleViewSubmissions = () => {
    // TODO: Implement view submissions functionality
    alert("View submissions functionality will be implemented");
  };

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
                {error || "Homework not found"}
              </h2>
            </div>
            <Button onClick={() => navigate("/staff/homework")}>
              Back to Homework List
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
          <span className="font-medium">Back to Homework</span>
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
            <StatusBadge status={homework.status} dueDate={homework.dueDate || homework.due_date} />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-xs text-gray-500 mb-1">Target Classes/Sections</div>
              <div className="text-sm font-medium text-gray-900">
                {homework.targets && homework.targets.length > 0
                  ? homework.targets.map(t => t.target_name || `${t.class_name} - ${t.section_name}`).join(", ")
                  : homework.class_name || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Created By</div>
              <div className="text-sm font-medium text-gray-900">
                {homework.teacher?.teacher_name || homework.teacher_name || homework.created_by || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Created Date</div>
              <div className="text-sm font-medium text-gray-900">
                {formatDate(homework.createdAt || homework.created_at)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Due Date</div>
              <div className="text-sm font-medium text-gray-900">
                {formatDate(homework.dueDate || homework.due_date)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Description */}
      <Card title="Description">
        <p className="text-gray-700 leading-relaxed">{homework.description}</p>
      </Card>

      {/* Instructions */}
      {homework.instructions && homework.instructions.length > 0 && (
        <Card title="Instructions">
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
        <Card title="Attachments">
          <div className="space-y-2">
            {homework.attachments.map((attachment, index) => (
              <a
                key={attachment.id || index}
                href={attachment.url}
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
                      {attachment.name || attachment.filename}
                    </div>
                    <div className="text-xs text-gray-500">{attachment.size}</div>
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
        <Card title="Submission Statistics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {homework.submission_stats.total || 0}
              </div>
              <div className="text-sm text-blue-700 mt-1">Total Students</div>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {homework.submission_stats.submitted || 0}
              </div>
              <div className="text-sm text-green-700 mt-1">Submitted</div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {homework.submission_stats.pending || 0}
              </div>
              <div className="text-sm text-yellow-700 mt-1">Pending</div>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {homework.submission_stats.overdue || 0}
              </div>
              <div className="text-sm text-red-700 mt-1">Overdue</div>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <Button onClick={handleViewSubmissions} className="flex-1">
            View Submissions
          </Button>
        </div>
      </Card>
    </div>
  );
}
