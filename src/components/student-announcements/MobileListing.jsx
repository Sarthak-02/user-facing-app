import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

export default function MobileListing({ announcements, className }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCardClick = (item) => {
    navigate(`/student/announcements/${item.id}`, { state: { announcement: item } });
  };

  const attachmentCount = (item) => item.attachmentCount ?? item.attachments?.length ?? 0;

  if (announcements.length === 0) {
    return (
      <div className="md:hidden bg-white rounded-xl border border-gray-200">
        <div className="text-center py-14 px-4">
          <div className="w-14 h-14 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700">{t("studentAnnouncements.noAnnouncements")}</p>
          <p className="text-xs text-gray-400 mt-1 px-2">{t("studentAnnouncements.noAnnouncementsDescription")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`md:hidden h-full overflow-y-auto space-y-3${className ? ` ${className}` : ""}`}>
      {announcements.map((item) => {
        const attachCount = attachmentCount(item);
        const dateStr = formatDate(item.submittedAt || item.submitted_at || item.createdAt);
        const sender = item.senderName || item.createdBy || t("studentAnnouncements.senderFallback");

        return (
          <div
            key={item.id}
            onClick={() => handleCardClick(item)}
            className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-violet-400 cursor-pointer active:scale-[0.99] transition-transform duration-100 overflow-hidden"
          >
            <div className="p-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-violet-700">{senderInitial(item)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {sender}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 mt-0.5 line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                </div>
              </div>

              {item.message && (
                <p className="text-xs text-gray-500 line-clamp-2 mt-2.5 leading-relaxed">
                  {item.message}
                </p>
              )}
            </div>

            <div className="px-4 py-2 bg-violet-50 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">{dateStr || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                {attachCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span>{attachCount}</span>
                  </div>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
