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
  
  if (status === "SUBMITTED") {
    return <Badge variant="success">Submitted</Badge>;
  } else if (due < now && status !== "SUBMITTED") {
    return <Badge variant="error">Overdue</Badge>;
  } else if (status === "ASSIGNED") {
    return <Badge variant="info">Assigned</Badge>;
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

export default function DesktopListing({ homeworkList }) {
  const navigate = useNavigate();

  const handleCardClick = (homeworkId) => {
    navigate(`/homework/${homeworkId}`);
  };

  return (
    <div className="hidden md:block h-full overflow-y-auto">
      {homeworkList.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium mb-2">No homework found</p>
            <p className="text-sm">There are no homework assignments at the moment.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {homeworkList.map((homework) => (
            <Card
              key={homework.id}
              className="cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => handleCardClick(homework.id)}
            >
              <div className="space-y-3">
                {/* Header with Subject and Status */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
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

                {/* Footer with Due Date and Attachments */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
