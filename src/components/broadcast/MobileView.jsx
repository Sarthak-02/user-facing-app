import BroadcastForm from "./BroadcastForm";
import TargetSelector from "../TargetSelector";

export default function MobileView({
  title,
  setTitle,
  targetType,
  setTargetType,
  studentId,
  setStudentId,
  classId,
  setClassId,
  sectionId,
  setSectionId,
  sections,
  students,
  message,
  setMessage,
  canSubmit,
  classes,
  sectionsByClassId,
  studentsBySectionId,
  showTargetModal,
  setShowTargetModal,
  TARGET_OPTIONS
}) {
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
              {formatTargetLabel({
                targetType,
                classId,
                sectionId,
                studentId,
                classes,
                sectionsByClassId,
                studentsBySectionId,
              })}
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
                {...{
                  targetType,
                  setTargetType,
                  classId,
                  sectionId,
                  studentId,
                  classes,
                  sections,
                  students,
                  setClassId,
                  setSectionId,
                  setStudentId,
                  TARGET_OPTIONS,
                }}
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

function formatTargetLabel({
  targetType,
  classId,
  sectionId,
  studentId,
  classes,
  sectionsByClassId,
  studentsBySectionId,
}) {
  if (targetType === "SCHOOL") return "Entire School";
  const c = classes.find((x) => x.id === classId)?.name;
  const s = sectionsByClassId[classId]?.find((x) => x.id === sectionId)?.name;
  const st = studentsBySectionId[sectionId]?.find(
    (x) => x.id === studentId
  )?.name;
  return [c, s, st].filter(Boolean).join(" • ");
}
