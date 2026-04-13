import { useNavigate } from "react-router-dom";

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function senderInitial(item) {
  const name = item.senderName || item.createdBy || "S";
  return name.charAt(0).toUpperCase();
}

export default function DesktopListing({ announcements }) {
  const navigate = useNavigate();

  const handleCardClick = (item) => {
    navigate(`/student/announcements/${item.id}`, { state: { announcement: item } });
  };

  if (announcements.length === 0) {
    return (
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100">
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-violet-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1">No announcements</p>
          <p className="text-sm text-gray-400">You have no school announcements yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:block h-full overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {announcements.map((item) => {
          const attachCount = item.attachmentCount ?? item.attachments?.length ?? 0;
          const dateStr = formatDate(item.submittedAt || item.submitted_at || item.createdAt);
          const sender = item.senderName || item.createdBy || "School";

          return (
            <div
              key={item.id}
              onClick={() => handleCardClick(item)}
              className="group bg-white rounded-2xl border border-gray-100 border-l-4 border-l-violet-400 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col"
            >
              <div className="p-5 pb-4 flex-1">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-violet-600">
                      {senderInitial(item)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">
                      {sender}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 mt-0.5 line-clamp-2 leading-snug group-hover:text-violet-700 transition-colors">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {item.message && (
                  <p className="text-xs text-gray-500 line-clamp-2 mt-3 leading-relaxed">
                    {item.message}
                  </p>
                )}
              </div>

              <div className="px-5 py-3 bg-violet-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 text-violet-400"
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
                  <span className="text-xs font-semibold text-gray-600">{dateStr || "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  {attachCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
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
                      <span>{attachCount}</span>
                    </div>
                  )}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-300 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
