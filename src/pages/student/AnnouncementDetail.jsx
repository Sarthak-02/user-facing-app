import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../ui-components";
import { getReceivedBroadcasts } from "../../api/broadcast.api";
import { useAuth } from "../../store/auth.store";
import Loader from "../../ui-components/Loader";

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

function attachmentHref(att) {
  return att?.fileUrl || att?.url || att?.href || att?.link;
}

function attachmentLabel(att) {
  return att?.fileName || att?.name || att?.title || null;
}

function senderInitial(name) {
  if (!name) return "S";
  return name.charAt(0).toUpperCase();
}

export default function AnnouncementDetail() {
  const { t } = useTranslation();
  const { announcementId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAuth();

  const [announcement, setAnnouncement] = useState(
    location.state?.announcement?.id === announcementId ? location.state.announcement : null
  );
  const [loading, setLoading] = useState(!announcement);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.announcement?.id === announcementId) {
      setAnnouncement(location.state.announcement);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const resolve = async () => {
      if (!auth.userId || !announcementId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getReceivedBroadcasts(auth.userId);
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const found = list.find((a) => a.id === announcementId);
        if (!cancelled) {
          if (found) setAnnouncement(found);
          else { setAnnouncement(null); setError("Announcement not found"); }
        }
      } catch (err) {
        console.error("Error loading announcement:", err);
        if (!cancelled) { setError(err.message || "Failed to load announcement"); setAnnouncement(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [announcementId, auth.userId, location.state]);

  const handleGoBack = () => navigate("/student/announcements");

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={handleGoBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-900">{t("studentAnnouncements.announcement")}</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-4">{error || t("studentAnnouncements.notFound")}</p>
            <Button onClick={handleGoBack}>{t("studentAnnouncements.backToAnnouncements")}</Button>
          </div>
        </div>
      </div>
    );
  }

  const attachments = Array.isArray(announcement.broadcastAttachments)
    ? announcement.broadcastAttachments
    : Array.isArray(announcement.attachments)
    ? announcement.attachments
    : [];
  const withLinks = attachments.map((att, i) => ({
    att, i,
    href: attachmentHref(att),
    label: attachmentLabel(att) || t("studentAnnouncements.attachmentIndex", { index: i + 1 }),
  }));
  const validAttachments = withLinks;
  const sender = announcement.senderName || announcement.createdBy || "School";

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={handleGoBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{announcement.title}</h1>
          <p className="text-xs text-gray-500">{t("studentAnnouncements.announcement")}</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto p-4 space-y-4 pb-8">

          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-5 text-white">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xl font-black text-white">{senderInitial(sender)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">{t("studentAnnouncements.from", { sender })}</p>
                <h2 className="text-xl font-bold leading-tight">{announcement.title}</h2>
                <p className="text-xs opacity-75 mt-2">
                  {formatDateTime(announcement.submittedAt || announcement.submitted_at || announcement.createdAt)}
                </p>
              </div>
            </div>

            {/* Meta pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {announcement.campusId && (
                <span className="text-xs bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 font-medium">
                  {announcement.campusId}
                </span>
              )}
              {validAttachments.length > 0 && (
                <span className="text-xs bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 font-medium flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {t("studentAnnouncements.attachmentCount", { count: validAttachments.length })}
                </span>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t("studentAnnouncements.message")}</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{announcement.message}</p>
          </div>

          {/* Attachments */}
          {validAttachments.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Attachments ({validAttachments.length})
              </h3>
              <div className="space-y-2">
                {validAttachments.map(({ att, href, label, i }) => {
                  const inner = (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 group-hover:bg-violet-50 group-hover:border-violet-100 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-800 truncate">{label}</span>
                      </div>
                      {href && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-violet-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                    </div>
                  );
                  return href ? (
                    <a key={att.id || i} href={href} className="group block" target="_blank" rel="noopener noreferrer">
                      {inner}
                    </a>
                  ) : (
                    <div key={att.id || i}>{inner}</div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
