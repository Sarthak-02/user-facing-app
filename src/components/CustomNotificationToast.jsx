/**
 * Custom notification component for Sonner toasts
 * Displays rich notifications with icons, styling, and actions
 */

export function NotificationContent({ title, body, type, url }) {
  // Get icon and color based on notification type
  const getTypeStyles = (notifType) => {
    switch (notifType) {
      case "ATTENDANCE":
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          bgColor: "bg-green-50",
          iconColor: "text-green-600",
          badgeColor: "bg-green-100 text-green-800",
        };
      case "HOMEWORK":
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          ),
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
          badgeColor: "bg-blue-100 text-blue-800",
        };
      case "EXAM":
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          ),
          bgColor: "bg-orange-50",
          iconColor: "text-orange-600",
          badgeColor: "bg-orange-100 text-orange-800",
        };
      case "BROADCAST":
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
          ),
          bgColor: "bg-purple-50",
          iconColor: "text-purple-600",
          badgeColor: "bg-purple-100 text-purple-800",
        };
      default:
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          ),
          bgColor: "bg-gray-50",
          iconColor: "text-gray-600",
          badgeColor: "bg-gray-100 text-gray-800",
        };
    }
  };

  const styles = getTypeStyles(type);

  return (
    <div className="flex items-start gap-3 p-1">
      <div
        className={`flex-shrink-0 ${styles.iconColor} ${styles.bgColor} p-2 rounded-lg`}
      >
        {styles.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          {type && (
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles.badgeColor}`}
            >
              {type}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-2">{body}</p>
        {url && (
          <button
            onClick={() => (window.location.href = url)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View Details
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Export helper to show custom notification
export function showCustomNotification(toast, payload) {
  const title = payload.notification?.title || "New Notification";
  const body = payload.notification?.body || "";
  const type = payload.data?.type;
  const url = payload.data?.url;

  return toast.custom(
    (t) => (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[320px] max-w-[420px]">
        <NotificationContent title={title} body={body} type={type} url={url} />
      </div>
    ),
    {
      duration: 5000,
      position: "top-right",
    }
  );
}
