import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPtmSlotById,
  parentBookSlot,
  completePtmBooking,
  markPtmNoShow,
  cancelPtmBooking,
  updatePtmNotes,
  sendPtmReminder,
  cancelPtmSlot,
  updatePtmSlot,
} from "../../api/ptm.api";
import { usePermissions } from "../../store/permissions.store";
import BookingActionsModal from "../../components/ptm/BookingActionsModal";
import SlotFormModal from "../../components/ptm/SlotFormModal";

const STATUS_COLORS = {
  AVAILABLE: "bg-green-100 text-green-700",
  BOOKED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-gray-100 text-gray-400",
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
};

function studentName(booking) {
  if (!booking?.student) return "Unknown Student";
  return `${booking.student.student_first_name} ${booking.student.student_last_name}`.trim();
}

function parentName(booking) {
  if (!booking?.parent) return null;
  return `${booking.parent.parent_first_name ?? ""} ${booking.parent.parent_last_name ?? ""}`.trim() || null;
}

// Per-booking notes row with inline expand
function BookingRow({ booking, slotDate, startTime, endTime, onManage, onSaveNotes, isSavingNotes }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(booking.teacherNotes || "");
  const [dirty, setDirty] = useState(false);

  const sName = studentName(booking);
  const pName = parentName(booking);
  const isActive = booking.status !== "CANCELLED";

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-blue-600">{sName.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{sName}</p>
          {pName && <p className="text-xs text-gray-400 truncate">Parent: {pName}</p>}
        </div>
        <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[booking.status] || "bg-gray-100 text-gray-500"}`}>
          {booking.status}
        </span>
      </div>

      {/* Action bar */}
      {isActive && (
        <div className="flex items-center gap-2 px-4 pb-3">
          <button
            onClick={() => onManage(booking, slotDate, startTime, endTime)}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Manage
          </button>
          <button
            onClick={() => setNotesOpen((v) => !v)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${notesOpen ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Notes{booking.teacherNotes ? " ·" : ""}
          </button>
        </div>
      )}

      {/* Inline notes panel */}
      {notesOpen && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-2">
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setDirty(true); }}
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors bg-white"
            placeholder="Add your notes about this meeting…"
          />
          <div className="flex justify-between items-center">
            {dirty && <span className="text-xs text-amber-500">Unsaved</span>}
            <button
              onClick={() => {
                onSaveNotes(booking.id, notes);
                setDirty(false);
              }}
              disabled={!dirty || isSavingNotes}
              className="ml-auto px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSavingNotes ? "Saving…" : "Save Notes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffPTMSlotDetail() {
  const { slotId } = useParams();
  const navigate = useNavigate();
  const { permissions, getStudentsBySection } = usePermissions();

  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState({ open: false, booking: null });
  const [editModal, setEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [editError, setEditError] = useState("");
  const [toast, setToast] = useState("");

  // Teacher-book-for-student state
  const [bookSectionId, setBookSectionId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [bookingForStudent, setBookingForStudent] = useState(false);

  const studentsInBookSection = useMemo(() => {
    if (!bookSectionId) return [];
    return [...(getStudentsBySection(bookSectionId) || [])].sort((a, b) =>
      (a.student_name || "").localeCompare(b.student_name || "", undefined, { sensitivity: "base" })
    );
  }, [bookSectionId, getStudentsBySection, permissions.students]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchSlot = async () => {
    setLoading(true);
    try {
      const data = await getPtmSlotById(slotId);
      setSlot(data);
    } catch {
      setSlot(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlot(); }, [slotId]);

  // Normalize: API may return bookings[] (multi) or booking (singular legacy)
  const bookings = useMemo(() => {
    if (!slot) return [];
    if (Array.isArray(slot.bookings)) return slot.bookings;
    if (slot.booking) return [slot.booking];
    return [];
  }, [slot]);

  const capacity = slot?.capacity ?? 1;
  const isCancelled = slot?.status === "CANCELLED";
  const spotsLeft = capacity - bookings.filter((b) => b.status !== "CANCELLED").length;
  const canAddMore = !isCancelled && spotsLeft > 0;

  // Already-booked student IDs to prevent double-booking in the picker
  const bookedStudentIds = useMemo(
    () => new Set(bookings.filter((b) => b.status !== "CANCELLED").map((b) => b.studentId)),
    [bookings]
  );

  const handleManage = (booking, slotDate, startTime, endTime) => {
    const enriched = {
      ...booking,
      studentName: studentName(booking),
      parentName: parentName(booking),
      slotDate,
      startTime,
      endTime,
    };
    setBookingModal({ open: true, booking: enriched });
  };

  const handleSaveNotes = async (booking_id, notes) => {
    setIsSavingNotes(true);
    try {
      await updatePtmNotes(booking_id, notes);
      showToast("Notes saved.");
      fetchSlot();
    } catch {
      showToast("Failed to save notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleComplete = async (booking_id) => {
    setIsSubmitting(true);
    try {
      await completePtmBooking(booking_id, {});
      showToast("Meeting marked as complete.");
      setBookingModal({ open: false, booking: null });
      fetchSlot();
    } catch { /* silent */ } finally { setIsSubmitting(false); }
  };

  const handleNoShow = async (booking_id) => {
    setIsSubmitting(true);
    try {
      await markPtmNoShow(booking_id);
      showToast("Marked as no-show.");
      setBookingModal({ open: false, booking: null });
      fetchSlot();
    } catch { /* silent */ } finally { setIsSubmitting(false); }
  };

  const handleCancelBooking = async (booking_id) => {
    setIsSubmitting(true);
    try {
      await cancelPtmBooking(booking_id, { cancelled_by_role: "TEACHER" });
      showToast("Booking cancelled.");
      setBookingModal({ open: false, booking: null });
      fetchSlot();
    } catch { /* silent */ } finally { setIsSubmitting(false); }
  };

  const handleSendReminder = async (booking_id) => {
    setIsSubmitting(true);
    try {
      await sendPtmReminder(booking_id);
      showToast("Reminder sent.");
    } catch { /* silent */ } finally { setIsSubmitting(false); }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleBookForStudents = async () => {
    if (selectedStudentIds.size === 0) return;
    setBookingForStudent(true);
    try {
      const bookings = [...selectedStudentIds].map((id) => ({ student_id: id }));
      await parentBookSlot(slotId, bookings);
      showToast(`${bookings.length} student${bookings.length !== 1 ? "s" : ""} booked successfully.`);
      setBookSectionId("");
      setSelectedStudentIds(new Set());
      fetchSlot();
    } catch (err) {
      showToast(err?.message || "Booking failed.");
    } finally {
      setBookingForStudent(false);
    }
  };

  const handleEditSlot = async ({ formData }) => {
    setIsSubmitting(true);
    setEditError("");
    try {
      await updatePtmSlot(slotId, formData);
      setEditModal(false);
      fetchSlot();
    } catch (err) {
      setEditError(err?.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSlot = async () => {
    try {
      await cancelPtmSlot(slotId);
      navigate("/staff/ptm");
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <div className="h-5 bg-gray-100 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Slot not found.</p>
          <button onClick={() => navigate("/staff/ptm")} className="mt-3 text-sm text-blue-500 hover:underline">
            Back to PTM
          </button>
        </div>
      </div>
    );
  }

  const activeBookings = bookings.filter((b) => b.status !== "CANCELLED");

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/staff/ptm")}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{slot.title}</h1>
          </div>
          <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[slot.status] || "bg-gray-100 text-gray-500"}`}>
            {slot.status}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        {/* Slot details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Slot Details</h2>
          {slot.description && <p className="text-sm text-gray-600">{slot.description}</p>}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400 text-xs block mb-0.5">Date</span>
              <span className="font-medium text-gray-900">
                {new Date(slot.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block mb-0.5">Time</span>
              <span className="font-medium text-gray-900">{slot.startTime} – {slot.endTime}</span>
            </div>
          </div>

          {!isCancelled && (
            <div className="flex gap-2 pt-2 border-t border-gray-50">
              <button
                onClick={() => { setEditError(""); setEditModal(true); }}
                className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                Edit Slot
              </button>
              <button
                onClick={handleCancelSlot}
                className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                Cancel Slot
              </button>
            </div>
          )}
        </div>

        {/* Bookings list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Bookings
              {bookings.length > 0 && (
                <span className="ml-2 text-xs font-medium text-gray-400 normal-case">
                  {activeBookings.length} active · {bookings.length - activeBookings.length} cancelled
                </span>
              )}
            </h2>
          </div>

          {bookings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">No bookings yet.</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  slotDate={slot.date}
                  startTime={slot.startTime}
                  endTime={slot.endTime}
                  onManage={handleManage}
                  onSaveNotes={handleSaveNotes}
                  isSavingNotes={isSavingNotes}
                />
              ))}
            </div>
          )}
        </div>

        {/* Book for student — only when spots remain */}
        {canAddMore && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Book for Student
              <span className="ml-2 text-xs font-normal text-green-600 normal-case">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} available</span>
            </h2>

            {/* Section picker */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block uppercase tracking-wide">Section</label>
              <select
                value={bookSectionId}
                onChange={(e) => { setBookSectionId(e.target.value); setSelectedStudentIds(new Set()); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select section…</option>
                {(permissions.sections || []).map((sec) => {
                  const cls = (permissions.classes || []).find((c) => c.class_id === sec.class_id);
                  return (
                    <option key={sec.section_id} value={sec.section_id}>
                      {cls ? `${cls.class_name} · ${sec.section_name}` : sec.section_name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Student checkbox list */}
            {bookSectionId && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Students</label>
                  {studentsInBookSection.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const selectableIds = studentsInBookSection
                          .filter((st) => !bookedStudentIds.has(st.student_id))
                          .map((st) => st.student_id)
                          .slice(0, spotsLeft);
                        const allSelected = selectableIds.every((id) => selectedStudentIds.has(id));
                        setSelectedStudentIds(allSelected ? new Set() : new Set(selectableIds));
                      }}
                      className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                    >
                      {studentsInBookSection.filter((st) => !bookedStudentIds.has(st.student_id)).every((st) => selectedStudentIds.has(st.student_id))
                        ? "Deselect all"
                        : `Select all (up to ${spotsLeft})`}
                    </button>
                  )}
                </div>

                {studentsInBookSection.length === 0 ? (
                  <p className="text-sm text-gray-400">No students in this section.</p>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-52 overflow-y-auto">
                    {studentsInBookSection.map((st) => {
                      const alreadyBooked = bookedStudentIds.has(st.student_id);
                      const isSelected = selectedStudentIds.has(st.student_id);
                      const atCapacity = !isSelected && selectedStudentIds.size >= spotsLeft;
                      const disabled = alreadyBooked || atCapacity;

                      return (
                        <label
                          key={st.student_id}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                            alreadyBooked ? "bg-gray-50 cursor-not-allowed" :
                            isSelected ? "bg-blue-50" :
                            atCapacity ? "opacity-40 cursor-not-allowed" :
                            "hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={disabled}
                            onChange={() => !disabled && toggleStudent(st.student_id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm text-gray-800 flex-1">
                            {st.student_name || st.student_id}
                          </span>
                          {alreadyBooked && (
                            <span className="text-xs text-gray-400">Booked</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {selectedStudentIds.size > 0 && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    {selectedStudentIds.size} student{selectedStudentIds.size !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleBookForStudents}
              disabled={selectedStudentIds.size === 0 || bookingForStudent}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {bookingForStudent
                ? "Booking…"
                : selectedStudentIds.size > 0
                  ? `Book ${selectedStudentIds.size} Student${selectedStudentIds.size !== 1 ? "s" : ""}`
                  : "Select students to book"}
            </button>
          </div>
        )}
      </div>

      <BookingActionsModal
        isOpen={bookingModal.open}
        onClose={() => setBookingModal({ open: false, booking: null })}
        booking={bookingModal.booking}
        onComplete={handleComplete}
        onNoShow={handleNoShow}
        onCancel={handleCancelBooking}
        onUpdateNotes={handleSaveNotes}
        onSendReminder={handleSendReminder}
        isSubmitting={isSubmitting}
      />

      <SlotFormModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        onSubmit={handleEditSlot}
        slot={slot}
        isSubmitting={isSubmitting}
        submitError={editError}
      />
    </div>
  );
}
