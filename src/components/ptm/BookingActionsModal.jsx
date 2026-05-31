import { useState, useEffect } from "react";

const STATUS_COLORS = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function BookingActionsModal({ isOpen, onClose, booking, onComplete, onNoShow, onCancel, onUpdateNotes, onSendReminder, isSubmitting }) {
  const [view, setView] = useState("actions"); // "actions" | "cancel"
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setView("actions");
    setCancelReason("");
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const status = booking.status;
  const isScheduled = status === "SCHEDULED";

  const handleComplete = () => {
    onComplete(booking.id);
  };

  const handleCancel = () => {
    onCancel(booking.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Booking Detail</h2>
            <span className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || "bg-gray-100 text-gray-500"}`}>
              {status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Booking Info */}
        <div className="px-6 pt-4 pb-2 space-y-1.5">
          {booking.studentName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Student</span>
              <span className="font-medium text-gray-900">{booking.studentName}</span>
            </div>
          )}
          {booking.parentName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Parent</span>
              <span className="font-medium text-gray-900">{booking.parentName}</span>
            </div>
          )}
          {booking.slotDate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">
                {new Date(booking.slotDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          )}
          {(booking.startTime || booking.endTime) && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Time</span>
              <span className="font-medium text-gray-900">{booking.startTime} – {booking.endTime}</span>
            </div>
          )}
        </div>

        {/* Cancel confirm panel */}
        {view === "cancel" && (
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-700 mb-4">Are you sure you want to cancel this booking? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setView("actions")}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Cancelling…" : "Cancel Booking"}
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {view === "actions" && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-2">
            {isScheduled && (
              <>
                <button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-green-500 rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Saving…" : "Mark as Complete"}
                </button>
                <button
                  onClick={() => onNoShow(booking.id)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  Mark No-Show
                </button>
                {onSendReminder && (
                  <button
                    onClick={() => onSendReminder(booking.id)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 disabled:opacity-50 transition-colors"
                  >
                    Send Reminder
                  </button>
                )}
                <button
                  onClick={() => setView("cancel")}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  Cancel Booking
                </button>
              </>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
