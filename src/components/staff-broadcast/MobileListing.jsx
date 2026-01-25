import { Card } from "../../ui-components";

export default function MobileListing({ broadcastList }) {
  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
      NOTIFYING: { bg: "bg-blue-100", text: "text-blue-700", label: "Notifying" },
      SUBMITTED: { bg: "bg-green-100", text: "text-green-700", label: "Submitted" },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatTargetInfo = (broadcast) => {
    const targets = broadcast.broadcastTargets || broadcast.targets || [];
    if (targets.length === 0) {
      return "No targets";
    }

    const firstTarget = targets[0];
    const targetType = firstTarget.targetType || firstTarget.target_type || "";

    if (targetType === "CAMPUS") {
      return "Entire Campus";
    } else if (targetType === "CLASS") {
      const classCount = targets.length;
      return classCount === 1 ? "1 Class" : `${classCount} Classes`;
    } else if (targetType === "SECTION") {
      const sectionCount = targets.length;
      return sectionCount === 1 ? "1 Section" : `${sectionCount} Sections`;
    } else if (targetType === "STUDENT") {
      const studentCount = targets.length;
      return studentCount === 1 ? "1 Student" : `${studentCount} Students`;
    }

    return "Unknown target";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (broadcastList.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-gray-300 mb-4"
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
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Broadcasts Yet</h3>
        <p className="text-gray-500 text-center max-w-md px-4">
          Create your first broadcast to send messages and announcements to students, classes, or the entire school.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-30 h-full overflow-y-auto">
      {broadcastList.map((broadcast) => (
        <Card
          key={broadcast.id || broadcast.broadcast_id}
          className="p-4 active:bg-gray-50 transition-colors"
        >
          {/* Header: Title and Status */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-3">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {broadcast.title}
              </h3>
            </div>
            <div className="flex-shrink-0">
              {getStatusBadge(broadcast.status)}
            </div>
          </div>

          {/* Message Preview */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {broadcast.message}
          </p>

          {/* Info Section */}
          <div className="space-y-2 mb-4">
            {/* Target */}
            <div className="flex items-center gap-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="text-gray-700">{formatTargetInfo(broadcast)}</span>
            </div>

            {/* Created Date */}
            <div className="flex items-center gap-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400 flex-shrink-0"
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
              <span className="text-gray-700">
                Created: {formatDate(broadcast.created_at || broadcast.createdAt)} {formatTime(broadcast.created_at || broadcast.createdAt)}
              </span>
            </div>

            {/* Sent Date */}
            {(broadcast.status === "NOTIFYING" || broadcast.status === "SUBMITTED") && (
              <div className="flex items-center gap-2 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span className="text-gray-700">
                  Sent: {formatDate(broadcast.submittedAt || broadcast.sentAt || broadcast.sent_at || broadcast.published_at)} {formatTime(broadcast.submittedAt || broadcast.sentAt || broadcast.sent_at || broadcast.published_at)}
                </span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
