import { useRef, useState } from "react";

export default function BroadcastForm({
  title,
  setTitle,
  message,
  setMessage,
  canSubmit,
  attachment,
  setAttachment,
}) {
  const fileRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  function handleFilePick() {
    fileRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // optional size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Attachment size should be less than 10MB");
      return;
    }

    setAttachment(file);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  }

  function removeAttachment() {
    setAttachment(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <section className="h-full col-span-8 flex flex-col border rounded-xl bg-[var(--color-surface)] overflow-hidden">
      {/* Form body scrolls */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 ">
        <Input
          label="Title"
          value={title}
          onChange={setTitle}
          placeholder="Enter title"
        />
  
        <Textarea
          label="Message"
          value={message}
          onChange={setMessage}
          placeholder="Write your message..."
        />

        {/* ===== Attachment ===== */}
        <div>
          <label className="text-xs font-semibold">Attachment (optional)</label>

          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          />

          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleFilePick}
              className="px-3 py-2 text-sm rounded-xl border bg-white"
            >
              Choose file
            </button>

            {attachment ? (
              <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl border bg-slate-50 text-sm">
                <div className="truncate">
                  <p className="font-medium truncate">{attachment.name}</p>
                  <p className="text-xs text-slate-500">
                    {(attachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={removeAttachment}
                  className="text-xs px-2 py-1 border rounded-lg"
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 self-center">
                PDF, images, docs (max 10MB)
              </p>
            )}
          </div>

          {/* Image preview */}
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Attachment preview"
              className="mt-3 max-h-48 w-full object-contain rounded-xl border"
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4 bg-[var(--color-surface)]">
        <button
          disabled={!canSubmit}
          className="w-full py-2 rounded-xl bg-[var(--color-primary-600)] text-white disabled:opacity-50"
        >
          Send Broadcast
        </button>
      </div>
    </section>
  );
}

/* ================= UI Components ================= */

function Input({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <label className="text-xs font-semibold mb-1">{label}</label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          flex-1 w-full border rounded-xl px-3 py-2 text-sm
          resize-none overflow-y-auto
        "
      />
    </div>
  );
}

