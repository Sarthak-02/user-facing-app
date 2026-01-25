import { Card } from "../../ui-components";

export default function DesktopListing({ broadcastList }) {
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
        <p className="text-gray-500 text-center max-w-md">
          Create your first broadcast to send messages and announcements to students, classes, or the entire school.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Target
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sent
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {broadcastList.map((broadcast) => (
              <tr
                key={broadcast.id || broadcast.broadcast_id}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Title & Message Preview */}
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {broadcast.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {broadcast.message}
                    </p>
                  </div>
                </td>

                {/* Target */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
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
                    <span className="text-sm text-gray-700">
                      {formatTargetInfo(broadcast)}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  {getStatusBadge(broadcast.status)}
                </td>

                {/* Created Date */}
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="text-gray-900">{formatDate(broadcast.created_at || broadcast.createdAt)}</p>
                    <p className="text-gray-500 text-xs">{formatTime(broadcast.created_at || broadcast.createdAt)}</p>
                  </div>
                </td>

                {/* Sent Date */}
                <td className="px-6 py-4">
                  <div className="text-sm">
                    {broadcast.status === "NOTIFYING" || broadcast.status === "SUBMITTED" ? (
                      <>
                        <p className="text-gray-900">{formatDate(broadcast.submittedAt || broadcast.sentAt || broadcast.sent_at || broadcast.published_at)}</p>
                        <p className="text-gray-500 text-xs">{formatTime(broadcast.submittedAt || broadcast.sentAt || broadcast.sent_at || broadcast.published_at)}</p>
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">Not sent</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
