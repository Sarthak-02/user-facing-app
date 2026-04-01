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

export default function MobileListing({ announcements }) {
  const navigate = useNavigate();

  const handleCardClick = (item) => {
    navigate(`/student/announcements/${item.id}`, { state: { announcement: item } });
  };

  const attachmentCount = (item) =>
    item.attachmentCount ?? item.attachments?.length ?? 0;

  return (
    <div className="md:hidden h-full overflow-y-auto space-y-3 pb-28">
      {announcements.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            No announcements from your school yet.
          </div>
        </Card>
      ) : (
        announcements.map((item) => (
          <Card
            key={item.id}
            className="cursor-pointer active:bg-gray-50 transition-colors"
            onClick={() => handleCardClick(item)}
          >
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Announcement
                </div>
                <h3 className="text-base font-semibold text-gray-900 mt-1 line-clamp-2">
                  {item.title}
                </h3>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">{item.message}</p>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-500">From</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5 truncate">
                    {item.senderName || item.createdBy || "School"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5">
                    {formatDate(item.submittedAt || item.submitted_at || item.createdAt)}
                  </div>
                </div>
              </div>

              {attachmentCount(item) > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-600 pt-2 border-t border-gray-100">
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
                  <span>
                    {attachmentCount(item)}{" "}
                    {attachmentCount(item) === 1 ? "attachment" : "attachments"}
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
