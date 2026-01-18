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

export default function MobileListing({ homeworkList }) {
  const navigate = useNavigate();
  
  const handleCardClick = (homeworkId) => {
    console.log("homeworkId", homeworkId);
    navigate(`/homework/${homeworkId}`);
  };

  return (
    <div className="md:hidden h-full overflow-y-auto space-y-3 pb-28">
      {homeworkList.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            No homework assignments found.
          </div>
        </Card>
      ) : (
        homeworkList.map((homework) => (
          <Card
            key={homework.id}
            className="cursor-pointer active:bg-gray-50 transition-colors"
            onClick={() => handleCardClick(homework.id)}
          >
            <div className="space-y-3">
              {/* Header with Subject */}
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {homework.subject}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mt-1">
                  {homework.title}
                </h3>
              </div>

              {/* Status Badge */}
              <div>
                <StatusBadge status={homework.status} dueDate={homework.dueDate} />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-500">Class / Section</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5">
                    {homework.class} - {homework.section}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Due Date</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5">
                    {formatDate(homework.dueDate)}
                  </div>
                </div>
              </div>

              {/* Attachments */}
              {homework.attachmentCount > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-600 pt-2 border-t border-gray-100">
                  <AttachmentIndicator count={homework.attachmentCount} />
                  <span className="ml-1">
                    {homework.attachmentCount === 1 ? "attachment" : "attachments"}
                  </span>
                </div>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
