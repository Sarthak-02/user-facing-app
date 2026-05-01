import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Clock, AlertCircle, Calendar, BookOpen, ClipboardCheck } from "lucide-react";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../api/notification.api";
import { useAuth } from "../store/auth.store";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslation } from "react-i18next";

dayjs.extend(relativeTime);

export default function NotificationDropdown() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fetch notifications when dropdown opens or on mount
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    // Fetch initial count
    fetchUnreadCount();

    // Set up polling every 30 seconds to update unread count
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await getUserNotifications({
        receiverId: auth?.userId,
        includeRead: false,
        limit: 1, // Only fetch count, not all notifications
        offset: 0,
      });
      
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getUserNotifications({
        receiverId: auth?.userId,
        includeRead: false,
        limit: 20,
        offset: 0,
      });

      // Use the notifications from the API response
      const notificationData = response.data || [];
      
      setNotifications(notificationData);
      setUnreadCount(response.count || notificationData.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read on backend
      await markNotificationAsRead(notification.id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Handle navigation based on notification type and sourceId
      if (notification.sourceType && notification.sourceId) {
        const userRole = auth?.role?.toLowerCase();
        const rolePrefix = userRole === "student" ? "student" : "staff";
        
        switch (notification.sourceType) {
          case "ATTENDANCE":
            navigate(`/${rolePrefix}/attendance`);
            break;
          case "HOMEWORK":
            navigate(`/${rolePrefix}/homework/${notification.sourceId}`);
            break;
          case "EXAM":
            navigate(`/${rolePrefix}/exams/${notification.sourceId}`);
            break;
          case "BROADCAST":
            if (userRole === "student" && notification.sourceId) {
              navigate(`/student/announcements/${notification.sourceId}`);
            }
            break;
          default:
            break;
        }
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(auth?.userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "ATTENDANCE":
        return <ClipboardCheck size={18} className="text-blue-600" />;
      case "HOMEWORK":
        return <BookOpen size={18} className="text-green-600" />;
      case "EXAM":
        return <Calendar size={18} className="text-purple-600" />;
      case "BROADCAST":
        return <Bell size={18} className="text-orange-600" />;
      case "SYSTEM":
        return <AlertCircle size={18} className="text-gray-600" />;
      default:
        return <Bell size={18} className="text-gray-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button 
        className="relative focus:outline-none hover:opacity-80 transition-opacity"
        onClick={handleToggleDropdown}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="
              absolute -top-1 -right-1
              h-5 w-5 rounded-full
              bg-red-500 text-white
              text-xs font-semibold
              flex items-center justify-center
            "
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute right-0 top-full mt-2
            w-80 md:w-96
            bg-surface
            border border-[var(--color-border)]
            rounded-lg shadow-lg
            overflow-hidden
            z-50
            max-h-[500px]
            flex flex-col
          "
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--color-border)] bg-primary-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">{t("notifications.title")}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  {t("notifications.markAllRead")}
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Bell size={40} className="text-gray-300 mb-2" />
                <p className="text-text-secondary text-sm">{t("notifications.noNotifications")}</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      w-full px-4 py-3 text-left
                      hover:bg-gray-50 transition-colors
                      ${!notification.read ? "bg-blue-50" : ""}
                    `}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.sourceType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                            {notification.message}
                          </p>
                          {!notification.read && (
                            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600 mt-1.5"></span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-text-secondary">
                          <Clock size={12} />
                          <span>
                            {notification.sentAt
                              ? dayjs(notification.sentAt).fromNow()
                              : t("notifications.recently")
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-[var(--color-border)] bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page if you have one
                  // navigate("/notifications");
                }}
                className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {t("notifications.viewAll")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
