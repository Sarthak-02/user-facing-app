import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../store/auth.store";
import {
  getAvailablePtmSlots,
  getPtmBookingsByStudent,
  createPtmBooking,
  cancelPtmBooking,
} from "../../api/ptm.api";

const BOOKING_STATUS_COLORS = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-gray-100 text-gray-400",
};

function AvailableSlotCard({ slot, onBook, isBooked }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{slot.title}</h3>
        {slot.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{slot.description}</p>
        )}
      </div>

      <div className="space-y-1.5 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{slot.teacherName || "Teacher"}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{new Date(slot.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{slot.startTime} – {slot.endTime}</span>
        </div>
      </div>

      <button
        onClick={() => onBook(slot)}
        disabled={isBooked}
        className={`w-full px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
          isBooked
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        {isBooked ? "Already Booked" : "Book This Slot"}
      </button>
    </div>
  );
}

function BookingCard({ booking, onCancel }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const isActive = booking.status === "SCHEDULED";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">{booking.slotTitle || "PTM Meeting"}</h3>
          {booking.teacherName && (
            <p className="text-sm text-gray-500 mt-0.5">with {booking.teacherName}</p>
          )}
        </div>
        <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${BOOKING_STATUS_COLORS[booking.status] || "bg-gray-100 text-gray-500"}`}>
          {booking.status}
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        {booking.slotDate && (
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date(booking.slotDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        )}
        {(booking.startTime || booking.endTime) && (
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{booking.startTime} – {booking.endTime}</span>
          </div>
        )}
      </div>

      {booking.teacherNotes && (
        <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-gray-700">
          <span className="font-medium text-blue-700 block mb-0.5 text-xs uppercase tracking-wide">Teacher's Notes</span>
          {booking.teacherNotes}
        </div>
      )}

      {isActive && (
        <div className="pt-1 border-t border-gray-50">
          {confirmCancel ? (
            <div className="flex gap-2">
              <button
                onClick={() => { onCancel(booking.id); setConfirmCancel(false); }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Yes, Cancel
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
            >
              Cancel Booking
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentPTM() {
  const { auth } = useAuth();
  const student_id = auth?.userId || "";

  const [tab, setTab] = useState("available");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchAvailable = useCallback(async () => {
    if (!student_id) return;
    setLoadingAvailable(true);
    try {
      const data = await getAvailablePtmSlots({ student_id });
      setAvailableSlots(Array.isArray(data) ? data : data?.slots || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingAvailable(false);
    }
  }, [student_id]);

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
    fetchAvailable();
    fetchBookings();
  }, [fetchAvailable, fetchBookings]);

  const handleBook = async (slot) => {
    setBookingInProgress(slot.id);
    try {
      await createPtmBooking({ ptm_slot_id: slot.id, student_id });
      showToast("Slot booked successfully!");
      fetchAvailable();
      fetchBookings();
      setTab("bookings");
    } catch (err) {
      showToast(err?.message || "Booking failed. Please try again.");
    } finally {
      setBookingInProgress(null);
    }
  };

  const handleCancelBooking = async (booking_id) => {
    try {
      await cancelPtmBooking(booking_id, { cancelled_by_role: "PARENT" });
      showToast("Booking cancelled.");
      fetchBookings();
      fetchAvailable();
    } catch {
      showToast("Could not cancel. Please try again.");
    }
  };

  const bookedSlotIds = new Set(
    bookings.filter((b) => b.status === "SCHEDULED").map((b) => b.ptmSlotId)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">Parent-Teacher Meetings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Book and track your PTM appointments.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 flex gap-1 py-2">
          <button
            onClick={() => setTab("available")}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === "available" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Available Slots
          </button>
          <button
            onClick={() => setTab("bookings")}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors relative ${tab === "bookings" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
          >
            My Bookings
            {bookings.filter((b) => b.status === "SCHEDULED").length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-blue-500 rounded-full">
                {bookings.filter((b) => b.status === "SCHEDULED").length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {tab === "available" && (
          <>
            {loadingAvailable ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                    <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">No slots available</p>
                <p className="text-sm text-gray-400 mt-1 max-w-xs">
                  Your teacher hasn't opened any PTM slots yet. Check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSlots.map((slot) => (
                  <AvailableSlotCard
                    key={slot.id}
                    slot={slot}
                    onBook={handleBook}
                    isBooked={bookedSlotIds.has(slot.id) || bookingInProgress === slot.id}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "bookings" && (
          <>
            {loadingBookings ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">No bookings yet</p>
                <p className="text-sm text-gray-400 mt-1 max-w-xs">
                  Book a slot from the Available Slots tab to get started.
                </p>
                <button
                  onClick={() => setTab("available")}
                  className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors"
                >
                  Browse Slots
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={handleCancelBooking}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
