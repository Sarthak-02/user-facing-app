import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../store/auth.store";
import {
  getPtmBookingsByStudent,
  // getAvailablePtmSlots, createPtmBooking, cancelPtmBooking — re-enable for student self-booking
} from "../../api/ptm.api";

const BOOKING_STATUS_COLORS = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-gray-100 text-gray-400",
};

// AvailableSlotCard removed — re-enable when student self-booking is turned on

function BookingCard({ booking }) {
  // const [confirmCancel, setConfirmCancel] = useState(false); — re-enable with student cancel flow

  const slot = booking.ptmSlot;
  const title = slot?.title || "PTM Meeting";
  const description = slot?.description || "";
  const slotDate = slot?.date;
  const startTime = slot?.startTime;
  const endTime = slot?.endTime;

  const teacherName = slot?.teacher
    ? `${slot.teacher.teacher_first_name} ${slot.teacher.teacher_last_name}`.trim()
    : null;
  const teacherInitial = teacherName ? teacherName.charAt(0).toUpperCase() : "T";

  const bookedAt = booking.bookedAt;
  const completedAt = booking.completedAt;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Status bar */}
      <div className={`h-1 w-full ${
        booking.status === "SCHEDULED" ? "bg-blue-400" :
        booking.status === "COMPLETED" ? "bg-green-400" :
        booking.status === "NO_SHOW" ? "bg-orange-400" :
        "bg-gray-200"
      }`} />

      <div className="p-5 flex flex-col gap-4">
        {/* Header: title + status */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900 leading-snug flex-1">{title}</h3>
          <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${BOOKING_STATUS_COLORS[booking.status] || "bg-gray-100 text-gray-500"}`}>
            {booking.status}
          </span>
        </div>

        {description && (
          <p className="text-sm text-gray-500 -mt-2">{description}</p>
        )}

        {/* Teacher */}
        {teacherName && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-indigo-600">{teacherInitial}</span>
            </div>
            <span className="text-sm text-gray-700 font-medium">{teacherName}</span>
          </div>
        )}

        {/* Date & time */}
        <div className="grid grid-cols-2 gap-3">
          {slotDate && (
            <div className="bg-gray-50 rounded-xl px-3 py-2.5">
              <span className="text-xs text-gray-400 block mb-0.5">Date</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(slotDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </span>
            </div>
          )}
          {(startTime || endTime) && (
            <div className="bg-gray-50 rounded-xl px-3 py-2.5">
              <span className="text-xs text-gray-400 block mb-0.5">Time</span>
              <span className="text-sm font-medium text-gray-900">{startTime} – {endTime}</span>
            </div>
          )}
        </div>

        {/* Booked / completed timestamps */}
        <div className="flex flex-col gap-1">
          {bookedAt && (
            <p className="text-xs text-gray-400">
              Booked on {new Date(bookedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
          {completedAt && (
            <p className="text-xs text-gray-400">
              Completed on {new Date(completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>

        {/* Teacher notes */}
        {booking.teacherNotes && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide block mb-1">Teacher's Notes</span>
            <p className="text-sm text-gray-700 leading-relaxed">{booking.teacherNotes}</p>
          </div>
        )}

        {/* Cancel action — re-enable when student cancellation is turned on
        {isActive && (
          <div className="border-t border-gray-50 pt-3">
            {confirmCancel ? (
              <div className="flex gap-2">
                <button onClick={() => { onCancel(booking.id); setConfirmCancel(false); }} ...>Yes, Cancel</button>
                <button onClick={() => setConfirmCancel(false)} ...>Keep</button>
              </div>
            ) : (
              <button onClick={() => setConfirmCancel(true)} ...>Cancel Booking</button>
            )}
          </div>
        )}
        */}
      </div>
    </div>
  );
}

export default function StudentPTM() {
  const { auth } = useAuth();
  const student_id = auth?.userId || "";

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchBookings = useCallback(async () => {
    if (!student_id) return;
    setLoadingBookings(true);
    try {
      const data = await getPtmBookingsByStudent({ student_id });
      setBookings(Array.isArray(data) ? data : data?.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [student_id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // TODO: re-enable student self-booking when that flow is turned on
  // const handleCancelBooking = async (booking_id) => { ... }

  const scheduledCount = bookings.filter((b) => b.status === "SCHEDULED").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Parent-Teacher Meetings</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your scheduled meetings with teachers.</p>
          </div>
          {scheduledCount > 0 && (
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {scheduledCount} upcoming
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {loadingBookings ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="h-1 bg-gray-100 rounded mb-5 -mx-5 -mt-5" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-12 bg-gray-100 rounded-xl" />
                  <div className="h-12 bg-gray-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No meetings scheduled</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Your teacher will schedule a PTM and it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                // onCancel={handleCancelBooking} — disabled: teacher-only booking flow
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
