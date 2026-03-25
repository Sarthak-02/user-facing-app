import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Badge, Button } from "../../ui-components";
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

function statusVariant(status) {
  if (status === "SUBMITTED") return "success";
  if (status === "NOTIFYING") return "info";
  if (status === "DRAFT") return "warning";
  return "info";
}

function attachmentHref(att) {
  return att?.fileUrl || att?.url || att?.href || att?.link;
}

function attachmentLabel(att, index) {
  return att?.fileName || att?.name || att?.title || `Attachment ${index + 1}`;
}

export default function AnnouncementDetail() {
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
          if (found) {
            setAnnouncement(found);
          } else {
            setAnnouncement(null);
            setError("Announcement not found");
          }
        }
      } catch (err) {
        console.error("Error loading announcement:", err);
        if (!cancelled) {
          setError(err.message || "Failed to load announcement");
          setAnnouncement(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [announcementId, auth.userId, location.state]);

  const handleGoBack = () => {
    navigate("/student/announcements");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !announcement) {
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
              <h2 className="text-xl font-semibold">{error || "Announcement not found"}</h2>
            </div>
            <Button onClick={() => navigate("/student/announcements")}>
              Back to announcements
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const attachments = Array.isArray(announcement.attachments) ? announcement.attachments : [];
  const withLinks = attachments.map((att, i) => ({
    att,
    i,
    href: attachmentHref(att),
    label: attachmentLabel(att, i),
  }));

  return (
    <div className="h-screen md:min-h-screen flex flex-col p-4 gap-6 pb-30 md:pb-6 overflow-y-auto">
      <div>
        <button
          type="button"
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
          <span className="font-medium">Back to announcements</span>
        </button>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                School announcement
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                {announcement.title}
              </h1>
            </div>
            {announcement.status ? (
              <Badge variant={statusVariant(announcement.status)}>{announcement.status}</Badge>
            ) : null}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-xs text-gray-500 mb-1">From</div>
              <div className="text-sm font-medium text-gray-900">
                {announcement.senderName || announcement.createdBy || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Campus</div>
              <div className="text-sm font-medium text-gray-900">
                {announcement.campusId || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Sent</div>
              <div className="text-sm font-medium text-gray-900">
                {formatDateTime(
                  announcement.submittedAt || announcement.submitted_at || announcement.createdAt
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Attachments</div>
              <div className="text-sm font-medium text-gray-900">
                {announcement.hasAttachments
                  ? announcement.attachmentCount ?? attachments.length
                  : attachments.length}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Message">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{announcement.message}</p>
      </Card>

      {withLinks.some((x) => x.href) && (
        <Card title="Attachments">
          <div className="space-y-2">
            {withLinks
              .filter((x) => x.href)
              .map(({ att, href, label, i }) => (
                <a
                  key={att.id || i}
                  href={href}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex items-center gap-3 min-w-0">
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
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{label}</div>
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 shrink-0"
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
    </div>
  );
}
