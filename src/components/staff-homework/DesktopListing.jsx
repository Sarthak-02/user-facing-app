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

function StatusBadges({ status, dueDate }) {
  const isPast = dueDate && new Date(dueDate) < new Date();
  const dueBadge = (status === "CLOSED" || isPast)
    ? <Badge variant="default">Closed</Badge>
    : <Badge variant="success">Active</Badge>;

  const pubBadge = status === "DRAFT"
    ? <Badge variant="warning">Draft</Badge>
    : <Badge variant="info">Published</Badge>;

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {pubBadge}
      {dueBadge}
    </div>
  );
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

export default function DesktopListing({ homeworkList, onEdit, onPublish, listFromPath }) {
  const navigate = useNavigate();

  const handleCardClick = (homeworkId) => {
    navigate(`/staff/homework/${homeworkId}`, {
      state: listFromPath ? { from: listFromPath } : undefined,
    });
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
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCardClick(homework.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {homework.title}
                  </h3>
                  <p className="text-sm text-gray-600">{homework.subject}</p>
                </div>
                <StatusBadges status={homework.status} dueDate={homework.dueDate} />
              </div>

              <div className="space-y-2">
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
                    {homework.className}
                    {homework.section && ` - ${homework.section}`}
                  </span>
                </div>

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

                {homework.assignedDate && (
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Assigned: {formatDate(homework.assignedDate)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <AttachmentIndicator count={homework.attachments?.length || 0} />
                </div>
              </div>

              {homework.status === "DRAFT" && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={(e) => handleEditClick(e, homework)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => handlePublishClick(e, homework)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Publish
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
