import { useState, useEffect, useCallback, useRef } from "react";
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
  Camera,
  ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../store/auth.store";
import { Badge, Loader, Modal } from "../../ui-components";
import Button from "../../ui-components/Button";
import CameraCapture from "../../ui-components/CameraCapture";
import {
  listAuthorizedPersons,
  addAuthorizedPerson,
  updateAuthorizedPerson,
  deleteAuthorizedPerson,
  createPickupRequest,
  listPickupRequests,
  uploadPickupPhoto,
} from "../../api/pickup.api";
import { compressImage } from "../../utils/compressImage";

const MAX_AUTHORIZED = 5;
const todayStr = new Date().toISOString().split("T")[0];

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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

// ─── Photo Picker ─────────────────────────────────────────────────────────────
// preview  – URL to display (remote URL when editing, object URL when new)
// onChange – called with (blob: Blob, previewUrl: string) when a new image is picked
// onRemove – called when the user removes the current photo

function PhotoPicker({ preview, onChange, onRemove }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const [compressing, setCompressing] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCompressing(true);
    try {
      const blob = await compressImage(file);
      const previewUrl = URL.createObjectURL(blob);
      onChange(blob, previewUrl);
    } catch {
      // Fallback: use original file uncompressed
      const previewUrl = URL.createObjectURL(file);
      onChange(file, previewUrl);
    } finally {
      setCompressing(false);
    }
  }

  if (compressing) {
    return (
      <div className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-xs font-medium">Processing image…</span>
      </div>
    );
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraRef}
        onChange={handleFile}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryRef}
        onChange={handleFile}
        className="hidden"
      />
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-36 object-cover rounded-xl border border-gray-200"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow border border-gray-200 text-gray-500 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="bg-white rounded-lg px-2.5 py-1.5 shadow border border-gray-200 text-xs font-medium text-gray-600 flex items-center gap-1 hover:bg-gray-50"
            >
              <Camera className="h-3.5 w-3.5" />
              Retake
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="bg-white rounded-lg px-2.5 py-1.5 shadow border border-gray-200 text-xs font-medium text-gray-600 flex items-center gap-1 hover:bg-gray-50"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Gallery
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 rounded-xl py-4 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs font-medium">Take Photo</span>
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 rounded-xl py-4 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
          >
            <ImageIcon className="h-5 w-5" />
            <span className="text-xs font-medium">From Gallery</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Person Form Modal ────────────────────────────────────────────────────────

function PersonFormModal({ open, onClose, onSave, initial, saving, error }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    relationship: initial?.relationship || "",
    photoBlob: null,
    photoPreview: initial?.photo_url || "",
    remarks: initial?.remarks || "",
  });

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Modal open={open} onClose={saving ? undefined : onClose} className="max-w-md">
      <h2 className="text-base font-bold text-gray-900 mb-4 pr-8">
        {initial?.id ? "Edit Authorized Person" : "Add Authorized Person"}
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
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. John Smith"
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Relationship <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.relationship}
            onChange={set("relationship")}
            placeholder="e.g. Father, Aunt, Guardian"
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Photo{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <PhotoPicker
            preview={form.photoPreview}
            onChange={(blob, previewUrl) =>
              setForm((prev) => ({ ...prev, photoBlob: blob, photoPreview: previewUrl }))
            }
            onRemove={() =>
              setForm((prev) => ({ ...prev, photoBlob: null, photoPreview: "" }))
            }
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Remarks{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={form.remarks}
            onChange={set("remarks")}
            placeholder="Additional notes…"
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
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
            {saving ? "Saving…" : initial?.id ? "Save Changes" : "Add Person"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Request Form Modal ───────────────────────────────────────────────────────

function RequestFormModal({ open, onClose, onSave, saving, error }) {
  const [form, setForm] = useState({
    name: "",
    relationship: "",
    valid_date: todayStr,
    photoBlob: null,
    photoPreview: "",
    remarks: "",
  });

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Modal open={open} onClose={saving ? undefined : onClose} className="max-w-md">
      <h2 className="text-base font-bold text-gray-900 mb-1 pr-8">
        One-Time Pickup Request
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Authorize someone to pick up your child on a specific date.
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
            Person's Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Jane Doe"
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Relationship <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.relationship}
            onChange={set("relationship")}
            placeholder="e.g. Family Friend, Driver"
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Valid Date <span className="text-red-500">*</span>
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
            Photo{" "}
            <span className="text-gray-400 font-normal">(optional — for identity check)</span>
          </label>
          <PhotoPicker
            preview={form.photoPreview}
            onChange={(blob, previewUrl) =>
              setForm((prev) => ({ ...prev, photoBlob: blob, photoPreview: previewUrl }))
            }
            onRemove={() =>
              setForm((prev) => ({ ...prev, photoBlob: null, photoPreview: "" }))
            }
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Remarks{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={form.remarks}
            onChange={set("remarks")}
            placeholder="Any additional information for the teacher…"
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
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
            {saving ? "Submitting…" : "Submit Request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ open, onClose, onConfirm, name, deleting }) {
  return (
    <Modal open={open} onClose={deleting ? undefined : onClose} className="max-w-sm">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h2 className="text-base font-bold text-gray-900 mb-1">Remove {name}?</h2>
        <p className="text-sm text-gray-500 mb-5">
          This person will no longer be authorized to pick up the student.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Person Card ──────────────────────────────────────────────────────────────

function PersonCard({ person, onEdit, onDelete }) {
  const initials = getInitials(person.name);
  const isActive = person.is_active !== false;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
      {person.photo_url ? (
        <img
          src={person.photo_url}
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
            {isActive ? "Active" : "Inactive"}
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
          aria-label={`Edit ${person.name}`}
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(person)}
          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          aria-label={`Remove ${person.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({ request }) {
  const initials = getInitials(request.name);
  const status = (request.status || "PENDING").toUpperCase();
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-orange-600">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">{request.name}</p>
          <Badge variant={requestStatusVariant(status)}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{request.relationship}</p>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>Valid: {formatDate(request.valid_date)}</span>
        </div>
        {request.remarks && (
          <p className="text-xs text-gray-400 mt-1 italic">"{request.remarks}"</p>
        )}
      </div>
      {request.photo_url && (
        <img
          src={request.photo_url}
          alt={request.name}
          className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentPickup() {
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

  // Requests
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState(null);
  const [requestStatusFilter, setRequestStatusFilter] = useState("ALL");

  // Request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestFormError, setRequestFormError] = useState(null);

  const loadPersons = useCallback(async () => {
    if (!studentId) return;
    setPersonsLoading(true);
    setPersonsError(null);
    try {
      const data = await listAuthorizedPersons(studentId, true);
      setPersons(Array.isArray(data) ? data : []);
    } catch (err) {
      setPersonsError(err?.message || err?.error || "Failed to load authorized persons");
    } finally {
      setPersonsLoading(false);
    }
  }, [studentId]);

  const loadRequests = useCallback(async () => {
    if (!studentId) return;
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const data = await listPickupRequests(studentId);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setRequestsError(err?.message || err?.error || "Failed to load pickup requests");
    } finally {
      setRequestsLoading(false);
    }
  }, [studentId]);

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
      // Upload new photo if one was selected
      let photo_url;
      if (form.photoBlob) {
        const entityId = editingPerson?.id || crypto.randomUUID();
        photo_url = await uploadPickupPhoto(form.photoBlob, "authorized_person", entityId);
      } else if (form.photoPreview && !form.photoPreview.startsWith("blob:")) {
        // Existing remote URL — keep it
        photo_url = form.photoPreview;
      }

      if (editingPerson?.id) {
        const updates = {
          name: form.name.trim(),
          relationship: form.relationship.trim(),
        };
        if (photo_url !== undefined) updates.photo_url = photo_url;
        if (form.remarks.trim()) updates.remarks = form.remarks.trim();
        await updateAuthorizedPerson(editingPerson.id, updates);
      } else {
        const payload = {
          student_id: studentId,
          name: form.name.trim(),
          relationship: form.relationship.trim(),
        };
        if (photo_url) payload.photo_url = photo_url;
        if (form.remarks.trim()) payload.remarks = form.remarks.trim();
        await addAuthorizedPerson(payload);
      }
      await loadPersons();
      setShowPersonModal(false);
      setEditingPerson(null);
    } catch (err) {
      setPersonFormError(err?.message || err?.error || "Failed to save. Please try again.");
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

  async function handleSaveRequest(form) {
    setRequestFormError(null);
    setRequestSaving(true);
    try {
      // Upload photo if selected
      let photo_url;
      if (form.photoBlob) {
        photo_url = await uploadPickupPhoto(
          form.photoBlob,
          "authorized_person",
          crypto.randomUUID(),
        );
      }

      const payload = {
        student_id: studentId,
        requested_by: studentId,
        name: form.name.trim(),
        relationship: form.relationship.trim(),
        valid_date: form.valid_date,
      };
      if (photo_url) payload.photo_url = photo_url;
      if (form.remarks.trim()) payload.remarks = form.remarks.trim();
      await createPickupRequest(payload);
      await loadRequests();
      setShowRequestModal(false);
    } catch (err) {
      setRequestFormError(err?.message || err?.error || "Failed to submit. Please try again.");
    } finally {
      setRequestSaving(false);
    }
  }

  const activePersons = persons.filter((p) => p.is_active !== false);
  const atCapacity = activePersons.length >= MAX_AUTHORIZED;

  const filteredRequests =
    requestStatusFilter === "ALL"
      ? requests
      : requests.filter((r) => (r.status || "PENDING") === requestStatusFilter);

  const statusFilterTabs = ["ALL", "PENDING", "APPROVED", "REJECTED", "COMPLETED"];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pb-24 md:pb-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl px-5 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Secure Pickup</h1>
            <p className="text-blue-200 text-xs mt-0.5">
              Manage who is authorized to pick up your child
            </p>
          </div>
          <div className="ml-auto flex-shrink-0 bg-white/20 text-white text-xs font-semibold rounded-full px-3 py-1">
            {activePersons.length}/{MAX_AUTHORIZED} persons
          </div>
        </div>
      </div>

      {/* Tab container */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
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
            Authorized Persons
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
            One-Time Requests
          </button>
        </div>

        {/* ── Authorized Persons Tab ──────────────────────────────────────── */}
        {activeTab === "authorized" && (
          <div className="p-4">
            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
              <Shield className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Add up to <strong>5 permanently authorized persons</strong>. They can pick up
                your child on any school day without additional approval.
              </p>
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {persons.length === 0 ? "No persons added yet" : `${persons.length} person${persons.length !== 1 ? "s" : ""} listed`}
                </p>
                {atCapacity && (
                  <p className="text-xs text-red-500 mt-0.5">Maximum of {MAX_AUTHORIZED} reached</p>
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
                Add Person
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
                  Retry
                </Button>
              </div>
            ) : persons.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="h-7 w-7 text-indigo-200" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  No authorized persons yet
                </p>
                <p className="text-xs text-gray-400">
                  Add trusted people who can pick up your child at any time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {persons.map((person) => (
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
          </div>
        )}

        {/* ── One-Time Requests Tab ───────────────────────────────────────── */}
        {activeTab === "requests" && (
          <div className="p-4">
            {/* Info banner */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700">
                Request a <strong>one-time pickup</strong> for a specific date. The school will
                review and approve or reject the request.
              </p>
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Your Requests</p>
              <Button
                variant="primary"
                onClick={() => {
                  setRequestFormError(null);
                  setShowRequestModal(true);
                }}
                className="flex items-center gap-1.5 text-sm"
              >
                <Plus className="h-4 w-4" />
                New Request
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
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
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
                  Retry
                </Button>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-7 w-7 text-orange-200" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  {requests.length === 0 ? "No requests yet" : "No matching requests"}
                </p>
                <p className="text-xs text-gray-400">
                  {requests.length === 0
                    ? "Submit a one-time request for a specific pickup date."
                    : "Try a different status filter."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((req) => (
                  <RequestCard key={req.id} request={req} />
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
    </div>
  );
}
