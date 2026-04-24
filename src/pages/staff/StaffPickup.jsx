import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  ClipboardCheck,
  Clock,
  Search,
  Check,
  X,
  AlertCircle,
  User,
  Calendar,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useAuth } from "../../store/auth.store";
import { usePermissions } from "../../store/permissions.store";
import { Badge, Loader, Modal } from "../../ui-components";
import Button from "../../ui-components/Button";
import PhotoPicker from "../../ui-components/PhotoPicker";
import {
  listPendingPickupRequests,
  approvePickupRequest,
  rejectPickupRequest,
  listAuthorizedPersons,
  listPickupRequests,
  confirmPickup,
  listTodayPickups,
} from "../../api/pickup.api";

const todayStr = new Date().toISOString().split("T")[0];

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function sourceBadge(source) {
  switch (source) {
    case "AUTHORIZED_PERSON":
      return { label: "Pre-Authorized", variant: "success" };
    case "ONE_TIME_REQUEST":
      return { label: "One-Time", variant: "info" };
    default:
      return { label: "Manual", variant: "info" };
  }
}

// ─── Confirm Pickup Modal ─────────────────────────────────────────────────────

function ConfirmPickupModal({ open, onClose, onConfirm, target, confirming }) {
  const [entityId] = useState(() => crypto.randomUUID());
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);

  async function handleConfirm() {
    setError(null);
    try {
      await onConfirm({ photo_url: photoUrl, notes: notes.trim() });
    } catch (err) {
      setError(err?.message || err?.error || "Confirmation failed. Please try again.");
    }
  }

  if (!target) return null;

  return (
    <Modal open={open} onClose={confirming ? undefined : onClose} className="max-w-md">
      <h2 className="text-base font-bold text-gray-900 mb-1 pr-8">Confirm Pickup</h2>
      <p className="text-xs text-gray-500 mb-4">
        Confirm that{" "}
        <strong className="text-gray-800">{target.person_name}</strong> (
        {target.person_relationship}) is picking up{" "}
        {target.student_name ? (
          <strong className="text-gray-800">{target.student_name}</strong>
        ) : (
          "the student"
        )}
        .
      </p>

      {/* Person info */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center gap-3">
        {target.photo_url ? (
          <img
            src={target.photo_url}
            alt={target.person_name}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-gray-200"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-violet-600" />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900">{target.person_name}</p>
          <p className="text-xs text-gray-500">{target.person_relationship}</p>
        </div>
        <div className="ml-auto">
          {target.type === "AUTHORIZED_PERSON" ? (
            <Badge variant="success">Pre-Authorized</Badge>
          ) : (
            <Badge variant="info">One-Time</Badge>
          )}
        </div>
      </div>

      {/* Photo */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">
          Pickup Photo{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </p>
        <PhotoPicker
          entity="pickup_log"
          entityId={entityId}
          preview={photoPreview}
          onPhotoUrl={(url, preview) => { setPhotoUrl(url); setPhotoPreview(preview); }}
          onRemove={() => { setPhotoUrl(""); setPhotoPreview(""); }}
        />
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Notes{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any observations or additional notes…"
          rows={2}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-300 focus:border-violet-400 outline-none bg-gray-50 resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-1.5 mb-3">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={confirming}>
          Cancel
        </Button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirming}
          className="flex-1 py-2.5 px-4 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Check className="h-4 w-4" />
          {confirming ? "Confirming…" : "Confirm Pickup"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Reject Request Modal ─────────────────────────────────────────────────────

function RejectModal({ open, onClose, onReject, request, rejecting }) {
  const [note, setNote] = useState("");

  return (
    <Modal open={open} onClose={rejecting ? undefined : onClose} className="max-w-sm">
      <h2 className="text-base font-bold text-gray-900 mb-1 pr-8">Reject Request</h2>
      <p className="text-xs text-gray-500 mb-3">
        Rejecting pickup request for{" "}
        <strong className="text-gray-800">{request?.name}</strong>.
      </p>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Reason{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for rejection…"
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 outline-none bg-gray-50 resize-none"
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={onClose}
          disabled={rejecting}
        >
          Cancel
        </Button>
        <button
          type="button"
          onClick={() => onReject(note.trim())}
          disabled={rejecting}
          className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {rejecting ? "Rejecting…" : "Reject"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Request Detail Modal ─────────────────────────────────────────────────────

function RequestDetailModal({ request, open, onClose, onApprove, onReject, approvingId, rejectingId }) {
  if (!request) return null;
  const photoUrl = request.photoUrl || request.photo_url;
  const validDate = request.validDate || request.valid_date;
  const studentName = request.studentName || request.student_name;
  const busy = approvingId === request.id || rejectingId === request.id;
  const status = (request.status || "PENDING").toUpperCase();

  function statusColor() {
    if (status === "APPROVED") return "text-green-600 bg-green-50";
    if (status === "REJECTED") return "text-red-600 bg-red-50";
    return "text-orange-600 bg-orange-50";
  }

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} className="max-w-md">
      <h2 className="text-base font-bold text-gray-900 mb-4 pr-8">Pickup Request</h2>

      {/* Photo + name */}
      <div className="flex flex-col items-center gap-2 mb-5">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={request.name}
            className="w-24 h-24 rounded-2xl object-cover border border-gray-200 shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-orange-100 flex items-center justify-center">
            <User className="h-10 w-10 text-orange-400" />
          </div>
        )}
        <p className="text-lg font-bold text-gray-900">{request.name}</p>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor()}`}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
      </div>

      {/* Details grid */}
      <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 mb-4">
        <DetailRow label="Relationship" value={request.relationship} />
        <DetailRow label="Valid Date" value={formatDate(validDate)} />
        {studentName && <DetailRow label="Student" value={studentName} />}
        {request.remarks && <DetailRow label="Remarks" value={request.remarks} />}
        <DetailRow
          label="Submitted"
          value={request.createdAt ? formatDate(request.createdAt) : "—"}
        />
      </div>

      {/* Actions — only show if PENDING */}
      {status === "PENDING" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { onApprove(request); onClose(); }}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {approvingId === request.id ? "Approving…" : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => { onClose(); onReject(request); }}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Reject
          </button>
        </div>
      )}
    </Modal>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value || "—"}</span>
    </div>
  );
}

// ─── Pending Request Card ─────────────────────────────────────────────────────

function PendingRequestCard({ request, onApprove, onReject, onView, approvingId, rejectingId }) {
  const busy = approvingId === request.id || rejectingId === request.id;
  const photoUrl = request.photoUrl || request.photo_url;
  const validDate = request.validDate || request.valid_date;
  const studentName = request.studentName || request.student_name;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onView()}
      className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:border-orange-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3 mb-3">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={request.name}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-gray-200"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-orange-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{request.name}</p>
          <p className="text-xs text-gray-500">{request.relationship}</p>
          {studentName && (
            <p className="text-xs text-gray-400 mt-0.5">
              Student: <span className="font-medium text-gray-600">{studentName}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(validDate)}
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </div>
      </div>
      {request.remarks && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3 italic">
          "{request.remarks}"
        </p>
      )}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onApprove(request)}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-100 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {approvingId === request.id ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => onReject(request)}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          {rejectingId === request.id ? "Rejecting…" : "Reject"}
        </button>
      </div>
    </div>
  );
}

// ─── Student Pickup Panel ─────────────────────────────────────────────────────

function StudentPickupPanel({ student, onConfirm }) {
  const [authorizedPersons, setAuthorizedPersons] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!student?.student_id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [persons, requests] = await Promise.all([
          listAuthorizedPersons(student.student_id),
          listPickupRequests(student.student_id, todayStr, "APPROVED"),
        ]);
        if (!cancelled) {
          setAuthorizedPersons(
            Array.isArray(persons) ? persons.filter((p) => p.is_active !== false) : []
          );
          setApprovedRequests(Array.isArray(requests) ? requests : []);
        }
      } catch (err) {
        if (!cancelled)
          setError(err?.message || err?.error || "Failed to load pickup data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [student?.student_id]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-6 w-6 text-red-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  const hasAny = authorizedPersons.length > 0 || approvedRequests.length > 0;

  if (!hasAny) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-2xl">
        <ShieldCheck className="h-8 w-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-600">No pickup authorization found</p>
        <p className="text-xs text-gray-400 mt-1">
          No pre-authorized persons or approved requests for today.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pre-authorized persons */}
      {authorizedPersons.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            Pre-Authorized Persons
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5 pb-16">
            {authorizedPersons.map((person) => (
              <div
                key={person.id}
                className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3"
              >
                {person.photo_url ? (
                  <img
                    src={person.photo_url}
                    alt={person.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-4.5 w-4.5 text-green-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{person.name}</p>
                  <p className="text-xs text-gray-500">{person.relationship}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onConfirm({
                      type: "AUTHORIZED_PERSON",
                      person_name: person.name,
                      person_relationship: person.relationship,
                      authorized_person_id: person.id,
                      photo_url: person.photo_url,
                      student_id: student.student_id,
                      student_name: student.student_name || student.student_id,
                    })
                  }
                  className="flex-shrink-0 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's approved one-time requests */}
      {approvedRequests.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            Today's Approved Requests
          </p>
          <div className="space-y-2">
            {approvedRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-blue-100 p-3 flex items-center gap-3"
              >
                {req.photo_url ? (
                  <img
                    src={req.photo_url}
                    alt={req.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{req.name}</p>
                  <p className="text-xs text-gray-500">{req.relationship}</p>
                  <Badge variant="info" className="mt-1">
                    One-time
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onConfirm({
                      type: "ONE_TIME_REQUEST",
                      person_name: req.name,
                      person_relationship: req.relationship,
                      pickup_request_id: req.id,
                      photo_url: req.photo_url,
                      student_id: student.student_id,
                      student_name: student.student_name || student.student_id,
                    })
                  }
                  className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pickup Log Card ──────────────────────────────────────────────────────────

function PickupLogCard({ log }) {
  const { label, variant } = sourceBadge(log.source);

  // Handle camelCase (API) with snake_case fallbacks
  const personName = log.personName || log.person_name;
  const personRelationship = log.personRelationship || log.person_relationship;
  const pickedUpAt = log.pickedUpAt || log.picked_up_at || log.createdAt || log.created_at;
  const photoUrl = log.pickupPhotoUrl || log.pickup_photo_url;

  // Student name from nested object or flat field
  const studentName = log.student
    ? `${log.student.student_first_name || ""} ${log.student.student_last_name || ""}`.trim() ||
      log.student.student_admission_no
    : log.student_name;

  // Teacher name from nested object or flat field
  const teacherName = log.teacher
    ? `${log.teacher.teacher_first_name || ""} ${log.teacher.teacher_last_name || ""}`.trim()
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{personName}</p>
            <Badge variant={variant}>{label}</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{personRelationship}</p>
          {studentName && (
            <p className="text-xs text-gray-400 mt-1">
              Student:{" "}
              <span className="font-medium text-gray-600">{studentName}</span>
              {log.student?.student_admission_no && (
                <span className="text-gray-400"> · #{log.student.student_admission_no}</span>
              )}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTime(pickedUpAt)}</span>
            </div>
            {teacherName && (
              <span className="text-xs text-gray-400">
                Confirmed by{" "}
                <span className="font-medium text-gray-600">{teacherName}</span>
              </span>
            )}
          </div>
          {log.notes && (
            <p className="text-xs text-gray-400 mt-1 italic">"{log.notes}"</p>
          )}
        </div>
        {photoUrl && (
          <img
            src={photoUrl}
            alt="Pickup"
            className="w-16 h-16 object-cover rounded-xl border border-gray-200 flex-shrink-0"
          />
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StaffPickup() {
  const { auth } = useAuth();
  const { permissions } = usePermissions();
  const teacherId = auth?.userId;
  const campusId = auth?.campus_id;

  const [activeTab, setActiveTab] = useState("pending");

  // ── Pending requests ────────────────────────────────────────────────────────
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [viewRequest, setViewRequest] = useState(null);

  // ── Confirm pickup ──────────────────────────────────────────────────────────
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirming, setConfirming] = useState(false);

  // ── Today's log ─────────────────────────────────────────────────────────────
  const [todayLogs, setTodayLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);

  const loadPending = useCallback(async () => {
    if (!campusId) return;
    setPendingLoading(true);
    setPendingError(null);
    try {
      const data = await listPendingPickupRequests(campusId, todayStr);
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setPendingError(err?.message || err?.error || "Failed to load pending requests");
    } finally {
      setPendingLoading(false);
    }
  }, [campusId]);

  const loadTodayLogs = useCallback(async () => {
    if (!campusId) return;
    setLogsLoading(true);
    setLogsError(null);
    try {
      const data = await listTodayPickups(campusId, todayStr);
      setTodayLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setLogsError(err?.message || err?.error || "Failed to load today's pickups");
    } finally {
      setLogsLoading(false);
    }
  }, [campusId]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    if (activeTab === "log") loadTodayLogs();
  }, [activeTab, loadTodayLogs]);

  async function handleApprove(request) {
    setApprovingId(request.id);
    try {
      await approvePickupRequest(request.id, teacherId);
      await loadPending();
    } catch (err) {
      console.error("Approve failed:", err);
    } finally {
      setApprovingId(null);
    }
  }

  async function handleReject(note) {
    if (!rejectTarget) return;
    setRejectingId(rejectTarget.id);
    try {
      await rejectPickupRequest(rejectTarget.id, teacherId, note);
      await loadPending();
      setRejectTarget(null);
    } catch (err) {
      console.error("Reject failed:", err);
    } finally {
      setRejectingId(null);
    }
  }

  async function handleConfirmPickup({ photo_url, notes }) {
    if (!confirmTarget) return;
    setConfirming(true);
    try {
      const payload = {
        student_id: confirmTarget.student_id,
        confirmed_by: teacherId,
        source: confirmTarget.type,
        person_name: confirmTarget.person_name,
        person_relationship: confirmTarget.person_relationship,
      };
      if (confirmTarget.authorized_person_id)
        payload.authorized_person_id = confirmTarget.authorized_person_id;
      if (confirmTarget.pickup_request_id)
        payload.pickup_request_id = confirmTarget.pickup_request_id;
      if (notes) payload.notes = notes;
      if (photo_url) payload.pickup_photo_url = photo_url;

      await confirmPickup(payload);
      setConfirmTarget(null);
      setSelectedStudent(null);
      setStudentSearch("");
      setActiveTab("log");
    } finally {
      setConfirming(false);
    }
  }

  // Student search filtered from teacher's permissions
  const allStudents = useMemo(() => permissions.students || [], [permissions.students]);

  const sectionMap = useMemo(() => {
    const map = {};
    (permissions.sections || []).forEach((sec) => {
      map[sec.section_id] = sec.section_name;
    });
    return map;
  }, [permissions.sections]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    if (!q || selectedStudent) return [];
    return allStudents
      .filter(
        (s) =>
          (s.student_name || "").toLowerCase().includes(q) ||
          (s.student_roll_no || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [allStudents, studentSearch, selectedStudent]);

  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const tabs = [
    { id: "pending", label: "Pending Requests", icon: ClipboardCheck },
    { id: "confirm", label: "Confirm Pickup", icon: ShieldCheck },
    { id: "log", label: "Today's Log", icon: Clock },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pb-24 md:pb-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl px-5 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Student Pickup</h1>
            <p className="text-violet-200 text-xs mt-0.5">{todayFormatted}</p>
          </div>
          {pendingRequests.length > 0 && (
            <div className="ml-auto flex-shrink-0 bg-orange-400 text-white text-xs font-bold rounded-full px-3 py-1">
              {pendingRequests.length} pending
            </div>
          )}
        </div>
      </div>

      {/* Tab container */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-violet-500 text-violet-600 bg-violet-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Pending Requests ──────────────────────────────────────── */}
        {activeTab === "pending" && (
          <div className="p-4">
            {pendingLoading ? (
              <div className="flex justify-center py-10">
                <Loader />
              </div>
            ) : pendingError ? (
              <div className="text-center py-10">
                <AlertCircle className="h-8 w-8 text-red-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">{pendingError}</p>
                <Button variant="secondary" onClick={loadPending}>
                  Retry
                </Button>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ClipboardCheck className="h-7 w-7 text-green-300" />
                </div>
                <p className="text-sm font-semibold text-gray-700">All clear!</p>
                <p className="text-xs text-gray-400 mt-1">
                  No one-time pickup requests pending for today.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 px-1">
                  {pendingRequests.length} request
                  {pendingRequests.length !== 1 ? "s" : ""} awaiting review
                </p>
                <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-0.5 pb-36">
                  {pendingRequests.map((req) => (
                    <PendingRequestCard
                      key={req.id}
                      request={req}
                      onApprove={handleApprove}
                      onReject={setRejectTarget}
                      onView={() => setViewRequest(req)}
                      approvingId={approvingId}
                      rejectingId={rejectingId}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Confirm Pickup ────────────────────────────────────────── */}
        {activeTab === "confirm" && (
          <div className="p-4">
            {/* Student search */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Search Student
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setSelectedStudent(null);
                  }}
                  placeholder="Search by student name or ID…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-300 focus:border-violet-400 outline-none bg-gray-50"
                />
              </div>

              {/* Dropdown results */}
              {filteredStudents.length > 0 && (
                <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 relative max-h-60 overflow-y-auto">
                  {filteredStudents.map((s) => (
                    <button
                      key={s.student_id}
                      type="button"
                      onClick={() => {
                        setSelectedStudent(s);
                        setStudentSearch(s.student_name || s.student_id);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {s.student_name || s.student_roll_no || s.student_id}
                        </p>
                        <p className="text-xs text-gray-400">
                          {s.student_roll_no && <span>{s.student_roll_no}</span>}
                          {s.student_roll_no && s.section_id && <span> · </span>}
                          {s.section_id && <span>{sectionMap[s.section_id] || s.section_id}</span>}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected student panel */}
            {selectedStudent ? (
              <div>
                <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5 mb-4">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-violet-600" />
                  </div>
                  <p className="flex-1 text-sm font-semibold text-violet-900">
                    {selectedStudent.student_name || selectedStudent.student_id}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentSearch("");
                    }}
                    className="text-violet-400 hover:text-violet-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <StudentPickupPanel
                  student={selectedStudent}
                  onConfirm={setConfirmTarget}
                />
              </div>
            ) : (
              !studentSearch && (
                <div className="text-center py-10 bg-gray-50 rounded-2xl">
                  <Search className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-600">Search for a student</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Type a name to see their authorized pickup persons and today's requests.
                  </p>
                </div>
              )
            )}
          </div>
        )}

        {/* ── Tab: Today's Log ───────────────────────────────────────────── */}
        {activeTab === "log" && (
          <div className="p-4">
            {logsLoading ? (
              <div className="flex justify-center py-10">
                <Loader />
              </div>
            ) : logsError ? (
              <div className="text-center py-10">
                <AlertCircle className="h-8 w-8 text-red-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">{logsError}</p>
                <Button variant="secondary" onClick={loadTodayLogs}>
                  Retry
                </Button>
              </div>
            ) : todayLogs.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-7 w-7 text-gray-200" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No pickups yet today</p>
                <p className="text-xs text-gray-400 mt-1">
                  Confirmed pickups will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 px-1">
                  {todayLogs.length} pickup{todayLogs.length !== 1 ? "s" : ""} confirmed today
                </p>
                <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-0.5 pb-36">
                  {todayLogs.map((log, i) => (
                    <PickupLogCard key={log.id || i} log={log} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <RequestDetailModal
        request={viewRequest}
        open={!!viewRequest}
        onClose={() => setViewRequest(null)}
        onApprove={handleApprove}
        onReject={setRejectTarget}
        approvingId={approvingId}
        rejectingId={rejectingId}
      />

      <RejectModal
        key={rejectTarget?.id ?? "closed-reject"}
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onReject={handleReject}
        request={rejectTarget}
        rejecting={!!rejectingId}
      />

      <ConfirmPickupModal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmPickup}
        target={confirmTarget}
        confirming={confirming}
      />
    </div>
  );
}
