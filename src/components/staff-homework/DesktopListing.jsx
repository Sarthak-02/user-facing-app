import { Badge, Card } from "../../ui-components";
import { useNavigate } from "react-router-dom";

function formatDate(date) {
  if (!date) return "";
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return formattedDate;
}

function StatusBadge({ status, dueDate }) {
  const now = new Date();
  const due = new Date(dueDate);
  
  if (status === "DRAFT") {
    return <Badge variant="warning">Draft</Badge>;
  } else if (status === "COMPLETED") {
    return <Badge variant="success">Completed</Badge>;
  } else if (due < now && status !== "COMPLETED" && status !== "DRAFT") {
    return <Badge variant="error">Overdue</Badge>;
  } else if (status === "PUBLISHED" || status === "ACTIVE") {
    return <Badge variant="info">Active</Badge>;
  }
  return <Badge variant="default">{status}</Badge>;
}

function AttachmentIndicator({ count }) {
  if (count === 0) return null;
  
  return (
    <div className="flex items-center gap-1 text-gray-600">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
        />
      </svg>
      <span className="text-sm">{count}</span>
    </div>
  );
}

export default function DesktopListing({ homeworkList, onEdit, onPublish }) {
  const navigate = useNavigate();

  const handleCardClick = (homeworkId) => {
    navigate(`/staff/homework/${homeworkId}`);
  };

  const handleEditClick = (e, homework) => {
    e.stopPropagation();
    onEdit(homework);
  };

  const handlePublishClick = (e, homework) => {
    e.stopPropagation();
    onPublish(homework);
  };

  return (
    <div className="h-full overflow-y-auto">
      {homeworkList.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium mb-2">No homework found</p>
            <p className="text-sm">Create your first homework assignment to get started.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
          {homeworkList.map((homework) => (
            <Card
              key={homework.id}
              className="cursor-pointer hover:shadow-md transition-shadow duration-200 relative"
              onClick={() => handleCardClick(homework.id)}
            >
              <div className="space-y-3">
                {/* Header with Subject and Status */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {homework.subject}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1 line-clamp-2">
                      {homework.title}
                    </h3>
                  </div>
                  <StatusBadge status={homework.status} dueDate={homework.dueDate} />
                </div>

                {/* Class/Section */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span>
                    {homework.class} - {homework.section}
                  </span>
                </div>

                {/* Submission Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Submissions</span>
                    <span className="font-medium text-gray-900">
                      {homework.submissionCount} / {homework.totalStudents}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(homework.submissionCount / homework.totalStudents) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Footer with Due Date and Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Due: {formatDate(homework.dueDate)}</span>
                    </div>
                    <AttachmentIndicator count={homework.attachmentCount} />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Publish Button (only for drafts) */}
                    {homework.status === "DRAFT" && (
                      <button
                        onClick={(e) => handlePublishClick(e, homework)}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                        title="Publish homework"
                      >
                        Publish
                      </button>
                    )}
                    
                    {/* Edit Button */}
                    <button
                      onClick={(e) => handleEditClick(e, homework)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit homework"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
