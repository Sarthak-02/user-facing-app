import BroadcastForm from "./BroadcastForm";
import TargetSelector from "../TargetSelector";

export default function MobileView({
  title,
  setTitle,
  targetType,
  setTargetType,
  message,
  setMessage,
  canSubmit,
  showTargetModal,
  setShowTargetModal,
  TARGET_OPTIONS,
  schema
}) {
  
  const formatTargetLabel = () => {
    if (targetType?.value === "SCHOOL") return "Entire School";
    
    // Get the selected values from schema
    let parts = [targetType?.label || ""];
    
    // Look through schema items to find selected values
    if (schema && Array.isArray(schema)) {
      schema.forEach(item => {
        if (item.selected) {
          if (Array.isArray(item.selected)) {
            if (item.selected.length === 1) {
              parts.push(item.selected[0].label);
            } else if (item.selected.length > 1) {
              parts.push(`${item.selected.length} ${item.type}s`);
            }
          } else if (item.selected.label) {
            parts.push(item.selected.label);
          }
        }
      });
    }
    
    return parts.filter(Boolean).join(" • ") || "Select Target";
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <button
          onClick={() => setShowTargetModal(true)}
          className="w-full px-4 py-3 rounded-xl border bg-[var(--color-surface)] flex justify-between items-center"
        >
          <div className="text-left">
            <p className="text-xs text-slate-500">Target audience</p>
            <p className="text-sm font-semibold">
              {formatTargetLabel()}
            </p>
          </div>
          <span className="text-xs px-2 py-1 border rounded-lg">Change</span>
        </button>
      </div>
      {showTargetModal && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowTargetModal(false)}
          />

          <div className="absolute bottom-0 w-full rounded-t-2xl bg-[var(--color-surface)] max-h-[85vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-sm font-semibold">Select Audience</h3>
              <button
                onClick={() => setShowTargetModal(false)}
                className="text-xs px-2 py-1 border rounded-lg"
              >
                Done
              </button>
            </div>

            <div className="p-4">
              <TargetSelector
                targetType={targetType}
                handleTargetTypeChange={setTargetType}
                TARGET_OPTIONS={TARGET_OPTIONS}
                schema={schema}
              />
            </div>
          </div>
        </div>
      )}
      <BroadcastForm
        title={title}
        setTitle={setTitle}
        message={message}
        setMessage={setMessage}
        canSubmit={canSubmit}
      />
    </div>
  );
}
