import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../store/auth.store";
import { usePermissions } from "../../store/permissions.store";
import { Badge, Modal } from "../../ui-components";
import {
  StaffPendingPickupShimmer,
  StudentPickupPanelShimmer,
  StaffPickupLogShimmer,
} from "../../ui-components/Shimmer";
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

function formatTime(iso, locale) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleTimeString(locale || undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDate(dateStr, locale) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString(locale || undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function pickupStatusLabel(status, t) {
  const s = (status || "PENDING").toUpperCase();
  return t(`pickup.requestStatus.${s}`, { defaultValue: s });
}

function sourceBadge(source, t) {
  switch (source) {
    case "AUTHORIZED_PERSON":
      return { label: t("staffPickup.sourcePreAuthorized"), variant: "success" };
    case "ONE_TIME_REQUEST":
      return { label: t("staffPickup.sourceOneTime"), variant: "info" };
    default:
      return { label: t("staffPickup.sourceManual"), variant: "info" };
  }
}

// ─── Confirm Pickup Modal ─────────────────────────────────────────────────────

function ConfirmPickupModal({ open, onClose, onConfirm, target, confirming }) {
  const { t } = useTranslation();
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
      setError(err?.message || err?.error || t("staffPickup.confirmationFailed"));
    }
  }

  if (!target) return null;

  return (
    <Modal open={open} onClose={confirming ? undefined : onClose} className="max-w-md">
      <h2 className="text-base font-bold text-gray-900 mb-1 pr-8">{t("staffPickup.confirmPickupTitle")}</h2>
      <p className="text-xs text-gray-500 mb-4">
        {t("staffPickup.confirmIntroBefore")}{" "}
        <strong className="text-gray-800">{target.person_name}</strong> (
        {target.person_relationship}) {t("staffPickup.confirmIntroMiddle")}{" "}
        {target.student_name ? (
          <strong className="text-gray-800">{target.student_name}</strong>
        ) : (
          t("staffPickup.theStudent")
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
            <Badge variant="success">{t("staffPickup.sourcePreAuthorized")}</Badge>
          ) : (
            <Badge variant="info">{t("staffPickup.sourceOneTime")}</Badge>
          )}
        </div>
      </div>

      {/* Photo */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">
          {t("staffPickup.pickupPhoto")}{" "}
          <span className="text-gray-400 font-normal">{t("staffPickup.optionalShort")}</span>
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
          {t("staffPickup.notes")}{" "}
          <span className="text-gray-400 font-normal">{t("staffPickup.optionalShort")}</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("staffPickup.notesPlaceholder")}
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
          {t("common.cancel")}
        </Button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirming}
          className="flex-1 py-2.5 px-4 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Check className="h-4 w-4" />
          {confirming ? t("staffPickup.confirmingPickup") : t("staffPickup.confirmPickupTitle")}
        </button>
      </div>
    </Modal>
  );
}

// ─── Reject Request Modal ─────────────────────────────────────────────────────

function RejectModal({ open, onClose, onReject, request, rejecting }) {
  const { t } = useTranslation();
  const [note, setNote] = useState("");

  return (
    <Modal open={open} onClose={rejecting ? undefined : onClose} className="max-w-sm">
      <h2 className="text-base font-bold text-gray-900 mb-1 pr-8">{t("staffPickup.rejectRequestTitle")}</h2>
      <p className="text-xs text-gray-500 mb-3">
        {t("staffPickup.rejectIntro")}{" "}
        <strong className="text-gray-800">{request?.name}</strong>.
      </p>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {t("staffPickup.reason")}{" "}
          <span className="text-gray-400 font-normal">{t("staffPickup.optionalShort")}</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("staffPickup.rejectReasonPlaceholder")}
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
          {t("common.cancel")}
        </Button>
        <button
          type="button"
          onClick={() => onReject(note.trim())}
          disabled={rejecting}
          className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {rejecting ? t("staffPickup.rejecting") : t("staffPickup.reject")}
        </button>
      </div>
    </Modal>
  );
}

// ─── Request Detail Modal ─────────────────────────────────────────────────────

function RequestDetailModal({ request, open, onClose, onApprove, onReject, approvingId, rejectingId }) {
  const { t, i18n } = useTranslation();
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
      <h2 className="text-base font-bold text-gray-900 mb-4 pr-8">{t("staffPickup.pickupRequestTitle")}</h2>

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
          {pickupStatusLabel(status, t)}
        </span>
      </div>

      {/* Details grid */}
      <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 mb-4">
        <DetailRow label={t("staffPickup.relationship")} value={request.relationship} />
        <DetailRow label={t("staffPickup.validDate")} value={formatDate(validDate, i18n.language)} />
        {studentName && <DetailRow label={t("staffPickup.student")} value={studentName} />}
        {request.remarks && <DetailRow label={t("staffPickup.remarks")} value={request.remarks} />}
        <DetailRow
          label={t("staffPickup.submitted")}
          value={request.createdAt ? formatDate(request.createdAt, i18n.language) : "—"}
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
            {approvingId === request.id ? t("staffPickup.approving") : t("staffPickup.approve")}
          </button>
          <button
            type="button"
            onClick={() => { onClose(); onReject(request); }}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            {t("staffPickup.reject")}
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
  const { t, i18n } = useTranslation();
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
              {t("staffPickup.studentLabelPrefix")} <span className="font-medium text-gray-600">{studentName}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(validDate, i18n.language)}
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
          {approvingId === request.id ? t("staffPickup.approving") : t("staffPickup.approve")}
        </button>
        <button
          type="button"
          onClick={() => onReject(request)}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          {rejectingId === request.id ? t("staffPickup.rejecting") : t("staffPickup.reject")}
        </button>
      </div>
    </div>
  );
}

// ─── Student Pickup Panel ─────────────────────────────────────────────────────

// ─── Person Profile Modal ─────────────────────────────────────────────────────

function PersonProfileModal({ person, onClose }) {
  const { t } = useTranslation();
  if (!person) return null;
  const isActive = person.is_active !== false;
  return (
    <Modal open={!!person} onClose={onClose} className="max-w-sm">
      <div className="flex flex-col items-center mb-5">
        {person.photo_url ? (
          <img
            src={person.photo_url}
            alt={person.name}
            className="w-24 h-24 rounded-2xl object-cover border border-gray-200 mb-3"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-green-100 flex items-center justify-center mb-3">
            <User className="h-10 w-10 text-green-400" />
          </div>
        )}
        <h2 className="text-base font-bold text-gray-900">{person.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{person.relationship}</p>
        <div className="mt-2">
          <Badge variant={isActive ? "success" : "error"}>
            {isActive ? t("staffPickup.active") : t("staffPickup.inactive")}
          </Badge>
        </div>
      </div>

      <div className="space-y-2.5 bg-gray-50 rounded-xl px-4 py-3 mb-4">
        <DetailRow label={t("staffPickup.relationship")} value={person.relationship} />
        {person.remarks && <DetailRow label={t("staffPickup.remarks")} value={person.remarks} />}
        {person.phone && <DetailRow label={t("staffPickup.phone")} value={person.phone} />}
      </div>

      <Button variant="secondary" className="w-full" onClick={onClose}>
        {t("common.close")}
      </Button>
    </Modal>
  );
}

// ─── Student Pickup Panel ─────────────────────────────────────────────────────

function StudentPickupPanel({ student, onConfirm }) {
  const { t, i18n } = useTranslation();
  const [authorizedPersons, setAuthorizedPersons] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [alreadyPickedUp, setAlreadyPickedUp] = useState(false);
  const [todayPickup, setTodayPickup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewPerson, setViewPerson] = useState(null);

  useEffect(() => {
    if (!student?.student_id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [personsResult, approvedReqs, pendingReqs] = await Promise.all([
          listAuthorizedPersons(student.student_id),
          listPickupRequests(student.student_id, todayStr, "APPROVED"),
          listPickupRequests(student.student_id, todayStr, "PENDING"),
        ]);
        if (!cancelled) {
          const persons = Array.isArray(personsResult)
            ? personsResult
            : Array.isArray(personsResult?.data)
            ? personsResult.data
            : [];
          setAuthorizedPersons(persons.filter((p) => (p.isActive ?? p.is_active) !== false));
          setAlreadyPickedUp(personsResult?.already_picked_up ?? false);
          setTodayPickup(personsResult?.today_pickup ?? null);
          setApprovedRequests(Array.isArray(approvedReqs) ? approvedReqs : []);
          setPendingRequests(Array.isArray(pendingReqs) ? pendingReqs : []);
        }
      } catch (err) {
        if (!cancelled)
          setError(err?.message || err?.error || t("staffPickup.loadPickupDataFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [student?.student_id, t]);

  if (loading) {
    return <StudentPickupPanelShimmer />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-6 w-6 text-red-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  const hasAny = authorizedPersons.length > 0 || approvedRequests.length > 0 || pendingRequests.length > 0;

  if (!hasAny) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-2xl">
        <ShieldCheck className="h-8 w-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-600">{t("staffPickup.noPickupAuth")}</p>
        <p className="text-xs text-gray-400 mt-1">
          {t("staffPickup.noPickupAuthDetail")}
        </p>
      </div>
    );
  }

  const teacherName = todayPickup?.teacher
    ? `${todayPickup.teacher.teacher_first_name || ""} ${todayPickup.teacher.teacher_last_name || ""}`.trim()
    : null;

  return (
    <div className="space-y-4 overflow-y-auto max-h-[18rem] pb-20">
      {/* Already picked up banner */}
      {alreadyPickedUp && todayPickup && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-bold text-green-800">{t("staffPickup.alreadyPickedUpTitle")}</p>
          </div>
          <div className="space-y-1 text-xs text-green-700">
            <p>
              <span className="font-semibold">{todayPickup.personName}</span>
              {todayPickup.personRelationship && (
                <span className="text-green-600"> · {todayPickup.personRelationship}</span>
              )}
            </p>
            <p>
              {t("staffPickup.timeLabel")} <span className="font-semibold">{formatTime(todayPickup.pickedUpAt, i18n.language)}</span>
            </p>
            {teacherName && (
              <p>
                {t("staffPickup.confirmedByLabel")} <span className="font-semibold">{teacherName}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pre-authorized persons */}
      {authorizedPersons.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            {t("staffPickup.preAuthorizedPersons")}
          </p>
          <div className="space-y-2">
            {authorizedPersons.map((person) => {
              const photoUrl = person.photoUrl || person.photo_url;
              return (
                <div
                  key={person.id}
                  className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3"
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={person.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{person.name}</p>
                    <p className="text-xs text-gray-500">{person.relationship}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewPerson({ ...person, photo_url: photoUrl })}
                      className="px-2.5 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
                    >
                      {t("staffPickup.view")}
                    </button>
                    {!alreadyPickedUp && (
                      <button
                        type="button"
                        onClick={() =>
                          onConfirm({
                            type: "AUTHORIZED_PERSON",
                            person_name: person.name,
                            person_relationship: person.relationship,
                            authorized_person_id: person.id,
                            photo_url: photoUrl,
                            student_id: student.student_id,
                            student_name: student.student_name || student.student_id,
                          })
                        }
                        className="px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                      >
                        {t("staffPickup.confirm")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's approved one-time requests */}
      {!alreadyPickedUp && approvedRequests.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            {t("staffPickup.todaysApprovedRequests")}
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
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{req.name}</p>
                  <p className="text-xs text-gray-500">{req.relationship}</p>
                  <Badge variant="info" className="mt-1">{t("staffPickup.oneTimeBadge")}</Badge>
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
                  {t("staffPickup.confirm")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's pending one-time requests */}
      {pendingRequests.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            {t("staffPickup.todaysPendingRequests")}
          </p>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-amber-100 p-3 flex items-center gap-3"
              >
                {req.photo_url ? (
                  <img
                    src={req.photo_url}
                    alt={req.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-amber-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{req.name}</p>
                  <p className="text-xs text-gray-500">{req.relationship}</p>
                  <Badge variant="warning" className="mt-1">{t("staffPickup.pendingApprovalBadge")}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <PersonProfileModal person={viewPerson} onClose={() => setViewPerson(null)} />
    </div>
  );
}

// ─── Pickup Log Card ──────────────────────────────────────────────────────────

function PickupLogCard({ log }) {
  const { t, i18n } = useTranslation();
  const { label, variant } = sourceBadge(log.source, t);

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
              {t("staffPickup.studentLabelPrefix")}{" "}
              <span className="font-medium text-gray-600">{studentName}</span>
              {log.student?.student_admission_no && (
                <span className="text-gray-400"> · #{log.student.student_admission_no}</span>
              )}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTime(pickedUpAt, i18n.language)}</span>
            </div>
            {teacherName && (
              <span className="text-xs text-gray-400">
                {t("staffPickup.confirmedByShort")}{" "}
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
            alt={t("staffPickup.pickupPhotoAlt")}
            className="w-16 h-16 object-cover rounded-xl border border-gray-200 flex-shrink-0"
          />
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StaffPickup() {
  const { t, i18n } = useTranslation();
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

  // ── Refresh ──────────────────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const [confirmRefreshKey, setConfirmRefreshKey] = useState(0);

  const loadPending = useCallback(async () => {
    if (!campusId) return;
    setPendingLoading(true);
    setPendingError(null);
    try {
      const data = await listPendingPickupRequests(campusId, todayStr);
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setPendingError(err?.message || err?.error || t("staffPickup.failedPending"));
    } finally {
      setPendingLoading(false);
    }
  }, [campusId, t]);

  const loadTodayLogs = useCallback(async () => {
    if (!campusId) return;
    setLogsLoading(true);
    setLogsError(null);
    try {
      const data = await listTodayPickups(campusId, todayStr);
      setTodayLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setLogsError(err?.message || err?.error || t("staffPickup.failedLogs"));
    } finally {
      setLogsLoading(false);
    }
  }, [campusId, t]);

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
    if (!q) return allStudents;
    return allStudents.filter(
      (s) =>
        (s.student_name || "").toLowerCase().includes(q) ||
        (s.student_roll_no || "").toLowerCase().includes(q)
    );
  }, [allStudents, studentSearch]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      if (activeTab === "pending") await loadPending();
      else if (activeTab === "log") await loadTodayLogs();
      else if (activeTab === "confirm") setConfirmRefreshKey((k) => k + 1);
    } finally {
      setRefreshing(false);
    }
  }

  const todayFormatted = useMemo(
    () =>
      new Date().toLocaleDateString(i18n.language || undefined, {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }),
    [i18n.language]
  );

  const tabs = useMemo(
    () => [
      { id: "pending", label: t("staffPickup.tabPending"), icon: ClipboardCheck },
      { id: "confirm", label: t("staffPickup.tabConfirm"), icon: ShieldCheck },
      { id: "log", label: t("staffPickup.tabLog"), icon: Clock },
    ],
    [t]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pb-16 md:pb-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl px-5 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t("staffPickup.pageTitle")}</h1>
            <p className="text-violet-200 text-xs mt-0.5">{todayFormatted}</p>
          </div>
          {pendingRequests.length > 0 && (
            <div className="ml-auto flex-shrink-0 bg-orange-400 text-white text-xs font-bold rounded-full px-3 py-1">
              {t("staffPickup.pendingBadge", { count: pendingRequests.length })}
            </div>
          )}
        </div>
      </div>

      {/* Refresh row */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} strokeWidth={2} />
          {t("staffPickup.refresh")}
        </button>
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
              <StaffPendingPickupShimmer />
            ) : pendingError ? (
              <div className="text-center py-10">
                <AlertCircle className="h-8 w-8 text-red-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">{pendingError}</p>
                <Button variant="secondary" onClick={loadPending}>
                  {t("staffPickup.retry")}
                </Button>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ClipboardCheck className="h-7 w-7 text-green-300" />
                </div>
                <p className="text-sm font-semibold text-gray-700">{t("staffPickup.allClear")}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {t("staffPickup.noPendingOneTime")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 px-1">
                  {t("staffPickup.requestsAwaiting", { count: pendingRequests.length })}
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
          <div className="p-4 pb-16">
            {selectedStudent ? (
              /* ── Student detail view ── */
              <>
                <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5 mb-4">
                  <div className="w-8 h-8 rounded-full bg-violet-200 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-violet-900 truncate">
                      {selectedStudent.student_name || selectedStudent.student_id}
                    </p>
                    {(selectedStudent.student_roll_no || selectedStudent.section_id) && (
                      <p className="text-xs text-violet-400">
                        {selectedStudent.student_roll_no && <span>{selectedStudent.student_roll_no}</span>}
                        {selectedStudent.student_roll_no && selectedStudent.section_id && <span> · </span>}
                        {selectedStudent.section_id && <span>{sectionMap[selectedStudent.section_id] || selectedStudent.section_id}</span>}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="text-violet-400 hover:text-violet-600 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <StudentPickupPanel
                  key={confirmRefreshKey}
                  student={selectedStudent}
                  onConfirm={setConfirmTarget}
                />
              </>
            ) : (
              /* ── Student list view ── */
              <>
                {/* Search */}
                <div className="mb-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder={t("staffPickup.searchPlaceholder")}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-300 focus:border-violet-400 outline-none bg-gray-50"
                    />
                    {studentSearch && (
                      <button
                        type="button"
                        onClick={() => setStudentSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Student list */}
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl">
                    <User className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-600">{t("staffPickup.noStudentsFound")}</p>
                    {studentSearch && (
                      <p className="text-xs text-gray-400 mt-1">{t("staffPickup.tryDifferentSearch")}</p>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-400 px-1 mb-2">
                      {t("staffPickup.studentCount", { count: filteredStudents.length })}
                    </p>
                    <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-0.5 pb-[18rem] md:pb-[10rem]">
                      {filteredStudents.map((s) => (
                        <button
                          key={s.student_id}
                          type="button"
                          onClick={() => setSelectedStudent(s)}
                          className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-left hover:border-violet-200 hover:shadow-sm transition-all"
                        >
                          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-violet-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {s.student_name || s.student_roll_no || s.student_id}
                            </p>
                            <p className="text-xs text-gray-400">
                              {s.student_roll_no && <span>{s.student_roll_no}</span>}
                              {s.student_roll_no && s.section_id && <span> · </span>}
                              {s.section_id && <span>{sectionMap[s.section_id] || s.section_id}</span>}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Tab: Today's Log ───────────────────────────────────────────── */}
        {activeTab === "log" && (
          <div className="p-4">
            {logsLoading ? (
              <StaffPickupLogShimmer />
            ) : logsError ? (
              <div className="text-center py-10">
                <AlertCircle className="h-8 w-8 text-red-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">{logsError}</p>
                <Button variant="secondary" onClick={loadTodayLogs}>
                  {t("staffPickup.retry")}
                </Button>
              </div>
            ) : todayLogs.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-7 w-7 text-gray-200" />
                </div>
                <p className="text-sm font-semibold text-gray-700">{t("staffPickup.noPickupsToday")}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {t("staffPickup.pickupsAppearHere")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 px-1">
                  {t("staffPickup.pickupsToday", { count: todayLogs.length })}
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
