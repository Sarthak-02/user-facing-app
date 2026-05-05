import { useState, useEffect, useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import {
  Shield,
  Users,
  Clock,
  Trash2,
  Edit2,
  Plus,
  Calendar,
  AlertCircle,
  User,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../../store/auth.store";
import { Badge, Loader, Modal } from "../../ui-components";
import Button from "../../ui-components/Button";
import PhotoPicker from "../../ui-components/PhotoPicker";
import {
  listAuthorizedPersons,
  addAuthorizedPerson,
  updateAuthorizedPerson,
  deleteAuthorizedPerson,
  createPickupRequest,
  listPickupRequests,
} from "../../api/pickup.api";

const MAX_AUTHORIZED = 5;
const todayStr = new Date().toISOString().split("T")[0];

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(dateStr, locale) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString(locale || undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function requestStatusVariant(status) {
  switch ((status || "").toUpperCase()) {
    case "APPROVED": return "success";
    case "COMPLETED": return "success";
    case "REJECTED": return "error";
    case "EXPIRED": return "error";
    default: return "info"; // PENDING
  }
}

function pickupRequestStatusLabel(status, t) {
  const s = (status || "PENDING").toUpperCase();
  return t(`pickup.requestStatus.${s}`);
}

// ─── Photo Picker ─────────────────────────────────────────────────────────────
// preview  – URL to display (remote URL when editing, object URL when new)
// ─── Person Form Modal ────────────────────────────────────────────────────────

function PersonFormModal({ open, onClose, onSave, initial, saving, error }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: initial?.name || "",
    relationship: initial?.relationship || "",
    photo_url: initial?.photo_url || "",
    photo_preview: initial?.photo_url || "",
    remarks: initial?.remarks || "",
  });
  // entityId is stable for the lifetime of this modal instance
  const [entityId] = useState(() => initial?.id || crypto.randomUUID());

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Modal open={open} onClose={saving ? undefined : onClose} className="max-w-md">
      <h2 className="text-base font-bold text-gray-900 mb-4 pr-8">
        {initial?.id ? t("pickup.personForm.editTitle") : t("pickup.personForm.addTitle")}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="space-y-3"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t("pickup.personForm.fullName")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder={t("pickup.personForm.fullNamePlaceholder")}
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t("pickup.personForm.relationship")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.relationship}
            onChange={set("relationship")}
            placeholder={t("pickup.personForm.relationshipPlaceholder")}
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t("pickup.personForm.photo")}{" "}
            <span className="text-gray-400 font-normal">({t("pickup.optional")})</span>
          </label>
          <PhotoPicker
            entity="authorized_person"
            entityId={entityId}
            preview={form.photo_preview}
            onPhotoUrl={(url, previewUrl) =>
              setForm((prev) => ({ ...prev, photo_url: url, photo_preview: previewUrl }))
            }
            onRemove={() =>
              setForm((prev) => ({ ...prev, photo_url: "", photo_preview: "" }))
            }
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t("pickup.personForm.remarks")}{" "}
            <span className="text-gray-400 font-normal">({t("pickup.optional")})</span>
          </label>
          <input
            type="text"
            value={form.remarks}
            onChange={set("remarks")}
            placeholder={t("pickup.personForm.remarksPlaceholder")}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
          />
        </div>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
            {saving ? t("pickup.personForm.saving") : initial?.id ? t("pickup.personForm.saveChanges") : t("pickup.personForm.addPerson")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Request Form Modal ───────────────────────────────────────────────────────

function RequestFormModal({ open, onClose, onSave, saving, error }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    relationship: "",
    valid_date: todayStr,
    photo_url: "",
    photo_preview: "",
    remarks: "",
  });
  const [entityId] = useState(() => crypto.randomUUID());

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Modal open={open} onClose={saving ? undefined : onClose} className="max-w-md">
      <h2 className="text-base font-bold text-gray-900 mb-1 pr-8">
        {t("pickup.requestForm.title")}
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        {t("pickup.requestForm.subtitle")}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="space-y-3"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t("pickup.requestForm.personFullName")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder={t("pickup.requestForm.personFullNamePlaceholder")}
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t("pickup.personForm.relationship")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.relationship}
            onChange={set("relationship")}
            placeholder={t("pickup.requestForm.relationshipPlaceholder")}
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t("pickup.requestForm.validDate")} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.valid_date}
            onChange={set("valid_date")}
            min={todayStr}
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t("pickup.personForm.photo")}{" "}
            <span className="text-gray-400 font-normal">({t("pickup.requestForm.photoOptional")})</span>
          </label>
          <PhotoPicker
            entity="authorized_person"
            entityId={entityId}
            preview={form.photo_preview}
            onPhotoUrl={(url, previewUrl) =>
              setForm((prev) => ({ ...prev, photo_url: url, photo_preview: previewUrl }))
            }
            onRemove={() =>
              setForm((prev) => ({ ...prev, photo_url: "", photo_preview: "" }))
            }
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t("pickup.personForm.remarks")}{" "}
            <span className="text-gray-400 font-normal">({t("pickup.optional")})</span>
          </label>
          <textarea
            value={form.remarks}
            onChange={set("remarks")}
            placeholder={t("pickup.requestForm.remarksPlaceholder")}
            rows={2}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50 resize-none"
          />
        </div>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
            {saving ? t("pickup.requestForm.submitting") : t("pickup.requestForm.submitRequest")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ open, onClose, onConfirm, name, deleting }) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={deleting ? undefined : onClose} className="max-w-sm">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h2 className="text-base font-bold text-gray-900 mb-1">{t("pickup.deleteConfirm.title", { name })}</h2>
        <p className="text-sm text-gray-500 mb-5">
          {t("pickup.deleteConfirm.message")}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={deleting}
          >
            {t("common.cancel")}
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? t("pickup.deleteConfirm.removing") : t("pickup.deleteConfirm.remove")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Person Card ──────────────────────────────────────────────────────────────

function PersonCard({ person, onEdit, onDelete }) {
  const { t } = useTranslation();
  const initials = getInitials(person.name);
  const isActive = person?.isActive ?? false ;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
      {person.photo_url ? (
        <img
          src={person?.photo_url}
          alt={person.name}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-200"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-indigo-600">{initials}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">{person.name}</p>
          <Badge variant={isActive ? "success" : "error"}>
            {isActive ? t("pickup.personCard.active") : t("pickup.personCard.inactive")}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{person.relationship}</p>
        {person.remarks && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{person.remarks}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => onEdit(person)}
          className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          aria-label={t("pickup.personCard.editAriaLabel", { name: person.name })}
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(person)}
          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          aria-label={t("pickup.personCard.removeAriaLabel", { name: person.name })}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Request Detail Modal ─────────────────────────────────────────────────────

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-gray-400 w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs font-medium text-gray-800 flex-1">{value || "—"}</span>
    </div>
  );
}

function RequestDetailModal({ request, onClose }) {
  const { t, i18n } = useTranslation();
  if (!request) return null;
  const status = (request.status || "PENDING").toUpperCase();
  const photoUrl = request.photoUrl || request.photo_url;
  const validDate = request.validDate || request.valid_date;
  const createdAt = request.createdAt || request.created_at;
  return (
    <Modal open={!!request} onClose={onClose} className="max-w-sm">
      <div className="flex flex-col items-center mb-5">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={request.name}
            className="w-24 h-24 rounded-2xl object-cover border border-gray-200 mb-3"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-orange-100 flex items-center justify-center mb-3">
            <User className="h-10 w-10 text-orange-300" />
          </div>
        )}
        <h2 className="text-base font-bold text-gray-900">{request.name}</h2>
        <div className="mt-1.5">
          <Badge variant={requestStatusVariant(status)}>
            {pickupRequestStatusLabel(status, t)}
          </Badge>
        </div>
      </div>

      <div className="space-y-2.5 bg-gray-50 rounded-xl px-4 py-3 mb-4">
        <DetailRow label={t("pickup.requestDetail.relationship")} value={request.relationship} />
        <DetailRow label={t("pickup.requestDetail.validDate")} value={formatDate(validDate, i18n.language)} />
        {request.remarks && <DetailRow label={t("pickup.requestDetail.remarks")} value={request.remarks} />}
        {createdAt && <DetailRow label={t("pickup.requestDetail.submitted")} value={formatDate(createdAt, i18n.language)} />}
        {(request.rejectionNote || request.rejection_note) && (
          <DetailRow label={t("pickup.requestDetail.rejectionNote")} value={request.rejectionNote || request.rejection_note} />
        )}
      </div>

      <Button variant="secondary" className="w-full" onClick={onClose}>
        {t("common.close")}
      </Button>
    </Modal>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({ request, onView }) {
  const { t, i18n } = useTranslation();
  const initials = getInitials(request.name);
  const status = (request.status || "PENDING").toUpperCase();
  const photoUrl = request.photoUrl || request.photo_url;
  const validDate = request.validDate || request.valid_date;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => e.key === "Enter" && onView()}
      className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 hover:border-gray-200 transition-colors active:scale-[0.99]"
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={request.name}
          className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-orange-600">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">{request.name}</p>
          <Badge variant={requestStatusVariant(status)}>
            {pickupRequestStatusLabel(status, t)}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{request.relationship}</p>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>{t("pickup.requestCard.valid", { date: formatDate(validDate, i18n.language) })}</span>
        </div>
        {request.remarks && (
          <p className="text-xs text-gray-400 mt-1 italic">"{request.remarks}"</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentPickup() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const studentId = auth?.userId;

  const [activeTab, setActiveTab] = useState("authorized");

  // Authorized persons
  const [persons, setPersons] = useState([]);
  const [personsLoading, setPersonsLoading] = useState(true);
  const [personsError, setPersonsError] = useState(null);

  // Person modal
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [personSaving, setPersonSaving] = useState(false);
  const [personFormError, setPersonFormError] = useState(null);

  // Delete confirm
  const [deletingPerson, setDeletingPerson] = useState(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Reactivate
  const [reactivatingId, setReactivatingId] = useState(null);

  // Requests
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState(null);
  const [requestStatusFilter, setRequestStatusFilter] = useState("ALL");

  // Request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestFormError, setRequestFormError] = useState(null);

  // Request detail view
  const [viewRequest, setViewRequest] = useState(null);

  const loadPersons = useCallback(async () => {
    if (!studentId) return;
    setPersonsLoading(true);
    setPersonsError(null);
    try {
      const result = await listAuthorizedPersons(studentId, true);
      const data = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];
      setPersons(data);
    } catch (err) {
      setPersonsError(err?.message || err?.error || t("pickup.errorLoadPersons"));
    } finally {
      setPersonsLoading(false);
    }
  }, [studentId, t]);

  const loadRequests = useCallback(async () => {
    if (!studentId) return;
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const data = await listPickupRequests(studentId);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setRequestsError(err?.message || err?.error || t("pickup.errorLoadRequests"));
    } finally {
      setRequestsLoading(false);
    }
  }, [studentId, t]);

  useEffect(() => {
    loadPersons();
  }, [loadPersons]);

  useEffect(() => {
    if (activeTab === "requests") loadRequests();
  }, [activeTab, loadRequests]);

  async function handleSavePerson(form) {
    setPersonFormError(null);
    setPersonSaving(true);
    try {
      if (editingPerson?.id) {
        const updates = {
          name: form.name.trim(),
          relationship: form.relationship.trim(),
        };
        if (form.photo_url) updates.photo_url = form.photo_url;
        if (form.remarks.trim()) updates.remarks = form.remarks.trim();
        await updateAuthorizedPerson(editingPerson.id, updates);
      } else {
        const payload = {
          student_id: studentId,
          name: form.name.trim(),
          relationship: form.relationship.trim(),
        };
        if (form.photo_url) payload.photo_url = form.photo_url;
        if (form.remarks.trim()) payload.remarks = form.remarks.trim();
        await addAuthorizedPerson(payload);
      }
      await loadPersons();
      setShowPersonModal(false);
      setEditingPerson(null);
    } catch (err) {
      setPersonFormError(err?.message || err?.error || t("pickup.errorSavePerson"));
    } finally {
      setPersonSaving(false);
    }
  }

  async function handleDeletePerson() {
    if (!deletingPerson) return;
    setDeleteInProgress(true);
    try {
      await deleteAuthorizedPerson(deletingPerson.id);
      await loadPersons();
      setDeletingPerson(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteInProgress(false);
    }
  }

  async function handleReactivatePerson(person) {
    setReactivatingId(person.id);
    try {
      await updateAuthorizedPerson(person.id, { is_active: true });
      await loadPersons();
    } catch (err) {
      console.error("Reactivate failed:", err);
    } finally {
      setReactivatingId(null);
    }
  }

  async function handleSaveRequest(form) {
    setRequestFormError(null);
    setRequestSaving(true);
    try {
      const payload = {
        student_id: studentId,
        requested_by: studentId,
        name: form.name.trim(),
        relationship: form.relationship.trim(),
        valid_date: form.valid_date,
      };
      if (form.photo_url) payload.photo_url = form.photo_url;
      if (form.remarks.trim()) payload.remarks = form.remarks.trim();
      await createPickupRequest(payload);
      await loadRequests();
      setShowRequestModal(false);
    } catch (err) {
      setRequestFormError(err?.message || err?.error || t("pickup.errorSubmitRequest"));
    } finally {
      setRequestSaving(false);
    }
  }

  const activePersons = persons.filter((p) => p.isActive !== false);
  const inactivePersons = persons.filter((p) => p.isActive === false);
  const atCapacity = activePersons.length >= MAX_AUTHORIZED;

  const filteredRequests =
    requestStatusFilter === "ALL"
      ? requests
      : requests.filter((r) => (r.status || "PENDING") === requestStatusFilter);

  const statusFilterTabs = ["ALL", "PENDING", "APPROVED", "REJECTED", "COMPLETED"];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pb-nav md:pb-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl px-5 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t("pickup.securePickup")}</h1>
            <p className="text-blue-200 text-xs mt-0.5">{t("pickup.manageSubtitle")}</p>
          </div>
          <div className="ml-auto flex-shrink-0 bg-white/20 text-white text-xs font-semibold rounded-full px-3 py-1">
            {t("pickup.personsCount", { active: activePersons.length, max: MAX_AUTHORIZED })}
          </div>
        </div>
      </div>

      {/* Tab container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm ">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          <button
            type="button"
            onClick={() => setActiveTab("authorized")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "authorized"
                ? "border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Users className="h-4 w-4" />
            {t("pickup.tabAuthorized")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "requests"
                ? "border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Clock className="h-4 w-4" />
            {t("pickup.tabRequests")}
          </button>
        </div>

        {/* ── Authorized Persons Tab ──────────────────────────────────────── */}
        {activeTab === "authorized" && (
          <div className="p-4">
            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
              <Shield className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                <Trans
                  i18nKey="pickup.authorizedPersonsBanner"
                  values={{ max: MAX_AUTHORIZED }}
                  components={{ strong: <strong /> }}
                />
              </p>
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {activePersons.length === 0
                    ? t("pickup.noActivePersonsSummary")
                    : t("pickup.activePersonsSummary", { count: activePersons.length })}
                </p>
                {atCapacity && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {t("pickup.maxCapacityReached", { max: MAX_AUTHORIZED })}
                  </p>
                )}
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingPerson(null);
                  setPersonFormError(null);
                  setShowPersonModal(true);
                }}
                disabled={atCapacity}
                className="flex items-center gap-1.5 text-sm"
              >
                <Plus className="h-4 w-4" />
                {t("pickup.addPerson")}
              </Button>
            </div>

            {personsLoading ? (
              <div className="flex justify-center py-10">
                <Loader />
              </div>
            ) : personsError ? (
              <div className="text-center py-10">
                <AlertCircle className="h-8 w-8 text-red-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">{personsError}</p>
                <Button variant="secondary" onClick={loadPersons}>
                  {t("common.tryAgain")}
                </Button>
              </div>
            ) : persons.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="h-7 w-7 text-indigo-200" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  {t("pickup.emptyAuthorizedTitle")}
                </p>
                <p className="text-xs text-gray-400">
                  {t("pickup.emptyAuthorizedSubtitle")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active persons */}
                {activePersons.length > 0 && (
                  <div className="space-y-3">
                    {activePersons.map((person) => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        onEdit={(p) => {
                          setEditingPerson(p);
                          setPersonFormError(null);
                          setShowPersonModal(true);
                        }}
                        onDelete={setDeletingPerson}
                      />
                    ))}
                  </div>
                )}

                {/* Inactive persons */}
                {inactivePersons.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
                      {t("pickup.inactiveSection")}
                    </p>
                    <div className="space-y-2">
                      {inactivePersons.map((person) => {
                        const initials = getInitials(person.name);
                        const busy = reactivatingId === person.id;
                        return (
                          <div
                            key={person.id}
                            className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center gap-3 opacity-60"
                          >
                            {person.photo_url ? (
                              <img
                                src={person.photo_url}
                                alt={person.name}
                                className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-200 grayscale"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-gray-400">{initials}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-500">{person.name}</p>
                              <p className="text-xs text-gray-400">{person.relationship}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleReactivatePerson(person)}
                              disabled={busy || atCapacity}
                              title={
                                atCapacity ? t("pickup.reactivateBlockedTitle") : t("pickup.reactivate")
                              }
                              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              {busy ? t("common.loading") : t("pickup.reactivate")}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {atCapacity && (
                      <p className="text-xs text-gray-400 mt-2 px-1">
                        {t("pickup.reactivateCapacityHint")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── One-Time Requests Tab ───────────────────────────────────────── */}
        {activeTab === "requests" && (
          <div className="p-4">
            {/* Info banner */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700">
                <Trans i18nKey="pickup.requestsInfoBanner" components={{ strong: <strong /> }} />
              </p>
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">{t("pickup.yourRequests")}</p>
              <Button
                variant="primary"
                onClick={() => {
                  setRequestFormError(null);
                  setShowRequestModal(true);
                }}
                className="flex items-center gap-1.5 text-sm"
              >
                <Plus className="h-4 w-4" />
                {t("pickup.newRequest")}
              </Button>
            </div>

            {/* Status filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4">
              {statusFilterTabs.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRequestStatusFilter(s)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    requestStatusFilter === s
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {pickupRequestStatusLabel(s === "ALL" ? "ALL" : s, t)}
                </button>
              ))}
            </div>

            {requestsLoading ? (
              <div className="flex justify-center py-10">
                <Loader />
              </div>
            ) : requestsError ? (
              <div className="text-center py-10">
                <AlertCircle className="h-8 w-8 text-red-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">{requestsError}</p>
                <Button variant="secondary" onClick={loadRequests}>
                  {t("common.tryAgain")}
                </Button>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-7 w-7 text-orange-200" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  {requests.length === 0
                    ? t("pickup.emptyRequestsNone")
                    : t("pickup.emptyRequestsFiltered")}
                </p>
                <p className="text-xs text-gray-400">
                  {requests.length === 0
                    ? t("pickup.emptyRequestsHintNone")
                    : t("pickup.emptyRequestsHintFiltered")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((req) => (
                  <RequestCard key={req.id} request={req} onView={() => setViewRequest(req)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <PersonFormModal
        key={showPersonModal ? (editingPerson?.id ?? "new") : "closed-person"}
        open={showPersonModal}
        onClose={() => {
          setShowPersonModal(false);
          setEditingPerson(null);
        }}
        onSave={handleSavePerson}
        initial={editingPerson}
        saving={personSaving}
        error={personFormError}
      />

      <RequestFormModal
        key={showRequestModal ? "open-request" : "closed-request"}
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSave={handleSaveRequest}
        saving={requestSaving}
        error={requestFormError}
      />

      <DeleteConfirmModal
        open={!!deletingPerson}
        onClose={() => setDeletingPerson(null)}
        onConfirm={handleDeletePerson}
        name={deletingPerson?.name}
        deleting={deleteInProgress}
      />

      <RequestDetailModal
        request={viewRequest}
        onClose={() => setViewRequest(null)}
      />
    </div>
  );
}
