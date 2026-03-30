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

  if (classPart && sectionPart) return `${classPart} - ${sectionPart}`;
  if (classPart) return classPart;
  if (sectionPart) return sectionPart;

  if (hw?.targets?.length) {
    return hw.targets
      .map((t) =>
        t.target_name ||
        [t.class_name, t.section_name].filter(Boolean).join(" - ")
      )
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
  return (
    hw?.assignedDate ||
    hw?.assigned_at ||
    hw?.published_at ||
    hw?.createdAt ||
    hw?.created_at ||
    ""
  );
}

function StatusBadge({ status, dueDate }) {
  const now = new Date();
  const due = new Date(dueDate);
  
  if (status === "SUBMITTED") {
    return <Badge variant="success">Submitted</Badge>;
  } else if (due < now && status !== "SUBMITTED") {
    return <Badge variant="error">Overdue</Badge>;
  } else if (status === "ASSIGNED") {
    return <Badge variant="info">Assigned</Badge>;
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
    navigate("/student/homework");
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
            <Button onClick={() => navigate("/student/homework")}>
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
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-xs text-gray-500 mb-1">Class / Section</div>
              <div className="text-sm font-medium text-gray-900">
                {classSectionLabel(homework)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Assigned By</div>
              <div className="text-sm font-medium text-gray-900">
                {assignedByLabel(homework)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Assigned Date</div>
              <div className="text-sm font-medium text-gray-900">
                {formatDate(assignedDateValue(homework)) || "—"}
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
        <Card title="Attachments" >
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

      {/* Submission Details (if submitted)
      {homework.submission && (
        <Card title="Your Submission">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <div className="text-sm font-medium text-green-900">
                  Submitted on {formatDateTime(homework.submission.submittedDate)}
                </div>
                {homework.submission.remarks && (
                  <div className="text-sm text-green-700 mt-1">
                    {homework.submission.remarks}
                  </div>
                )}
              </div>
            </div>

            {homework.submission.submittedFiles &&
              homework.submission.submittedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Submitted Files:
                  </div>
                  {homework.submission.submittedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500">{file.size}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </Card>
      )} */}

      {/* Submit Button (if not submitted) */}
      {/* {homework.status !== "SUBMITTED" && (
        <Card>
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="text-sm text-gray-600">
              {new Date(homework.dueDate) < new Date() ? (
                <span className="text-red-600 font-medium">
                  This homework is overdue!
                </span>
              ) : (
                <span>
                  Time remaining:{" "}
                  {Math.ceil(
                    (new Date(homework.dueDate) - new Date()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </span>
              )}
            </div>
            <Button onClick={handleSubmit} className="w-full md:w-auto">
              Submit Homework
            </Button>
          </div>
        </Card>
      )} */}
    </div>
  );
}
