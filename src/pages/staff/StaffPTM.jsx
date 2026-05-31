import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth.store";
import { getPtmSlotsByTeacher, createPtmSlot, updatePtmSlot, cancelPtmSlot } from "../../api/ptm.api";
import SlotFormModal from "../../components/ptm/SlotFormModal";

const STATUS_COLORS = {
  AVAILABLE: "bg-green-100 text-green-700",
  BOOKED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-gray-100 text-gray-400",
};

function SlotCard({ slot, onEdit, onCancel, onClick }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const isCancelled = slot.status === "CANCELLED";

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 transition-all ${isCancelled ? "border-gray-100 opacity-60" : "border-gray-100 hover:shadow-md cursor-pointer"}`}
      onClick={() => !isCancelled && onClick(slot)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">{slot.title}</h3>
          {slot.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{slot.description}</p>
          )}
        </div>
        <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[slot.status] || "bg-gray-100 text-gray-500"}`}>
          {slot.status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{new Date(slot.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{slot.startTime} – {slot.endTime}</span>
        </div>
      </div>

      {!isCancelled && (
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            {(() => {
              const bArr = Array.isArray(slot.bookings) ? slot.bookings : slot.booking ? [slot.booking] : [];
              const active = bArr.filter((b) => b.status !== "CANCELLED").length;
              const cap = slot.capacity ?? 1;
              if (active === 0) return "Open for booking";
              if (cap === 1 && bArr[0]?.student)
                return `${bArr[0].student.student_first_name} ${bArr[0].student.student_last_name}`;
              return `${active} / ${cap} booked`;
            })()}
          </span>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {slot.status === "AVAILABLE" && (
              <button
                onClick={() => onEdit(slot)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Edit slot"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            {confirmCancel ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onCancel(slot.id); setConfirmCancel(false); }}
                  className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Keep
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmCancel(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Cancel slot"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffPTM() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const teacher_id = auth?.userId || "";
  const campus_id = auth?.campus?.campus_id || auth?.campus_id || "";

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState({ open: false, slot: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchSlots = useCallback(async () => {
    if (!teacher_id) return;
    setLoading(true);
    try {
      const params = { teacher_id };
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await getPtmSlotsByTeacher(params);
      setSlots(Array.isArray(data) ? data : data?.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [teacher_id, statusFilter]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      if (formModal.slot) {
        await updatePtmSlot(formModal.slot.id, formData);
      } else {
        await createPtmSlot({ ...formData, teacher_id, campus_id, created_by: teacher_id });
      }
      setFormModal({ open: false, slot: null });
      fetchSlots();
    } catch (err) {
      setSubmitError(err?.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelPtmSlot(id);
      setSlots((prev) => prev.map((s) => s.id === id ? { ...s, status: "CANCELLED" } : s));
    } catch {
      // silent
    }
  };

  const filteredSlots = statusFilter === "all" ? slots : slots.filter((s) => s.status === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Parent-Teacher Meetings</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create and manage your PTM slots.</p>
          </div>
          <button
            onClick={() => { setSubmitError(""); setFormModal({ open: true, slot: null }); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Slot
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 flex gap-1 py-2">
          {["all", "AVAILABLE", "BOOKED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === s ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
            >
              {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No slots yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Create your first PTM slot so parents can book a meeting time.
            </p>
            <button
              onClick={() => { setSubmitError(""); setFormModal({ open: true, slot: null }); }}
              className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors"
            >
              Create First Slot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                onEdit={(s) => { setSubmitError(""); setFormModal({ open: true, slot: s }); }}
                onCancel={handleCancel}
                onClick={(s) => navigate(`/staff/ptm/${s.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <SlotFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, slot: null })}
        onSubmit={handleFormSubmit}
        slot={formModal.slot}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  );
}
