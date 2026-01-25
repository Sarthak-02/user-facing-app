import BroadcastForm from "./BroadcastForm";
import TargetSelector from "../TargetSelector";

export default function DesktopView({
  title,
  setTitle,
  targetType,
  setTargetType,
  TARGET_OPTIONS,
  message,
  setMessage,
  canSubmit,
  schema
}) {
   
  return (
    <div className="grid md:grid-cols-12 gap-4 overflow-hidden h-full md:h-[calc(100vh-6rem)]">
      {/* ---- Desktop Target Panel ---- */}
      <aside className="h-1/2 col-span-4 border rounded-xl p-4 bg-[var(--color-surface)]">
        <TargetSelector
          targetType={targetType}
          handleTargetTypeChange={setTargetType}
          TARGET_OPTIONS={TARGET_OPTIONS}
          schema={schema}
        />
      </aside>

      {/* ---- Form ---- */}
      <div className="col-span-8 h-auto">
      <BroadcastForm
        title={title}
        setTitle={setTitle}
        message={message}
        setMessage={setMessage}
        canSubmit={canSubmit}
      />
      </div>
      
    </div>
  );
}
