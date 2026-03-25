import { Card } from "../../ui-components";
import { useNavigate } from "react-router-dom";

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AttachmentIndicator({ count }) {
  if (!count) return null;
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

export default function DesktopListing({ announcements }) {
  const navigate = useNavigate();

  const handleCardClick = (item) => {
    navigate(`/student/announcements/${item.id}`, { state: { announcement: item } });
  };

  return (
    <div className="hidden md:block h-full overflow-y-auto">
      {announcements.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium mb-2">No announcements</p>
            <p className="text-sm">You have no school announcements yet.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {announcements.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => handleCardClick(item)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      From school
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1 line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">{item.message}</p>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="truncate">{item.senderName || item.createdBy || "School"}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 shrink-0"
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
                    <span>
                      {formatDate(item.submittedAt || item.submitted_at || item.createdAt)}
                    </span>
                  </div>
                  <AttachmentIndicator
                    count={item.attachmentCount ?? item.attachments?.length ?? 0}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
