import BroadcastForm from "./BroadcastForm";
import TargetSelector from "./TargetSelector";

export default function DesktopView({title,
    setTitle,
    targetType,
  
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
    resetCascade,
    classes}) {
   
  return (
    <div className="h-full grid md:grid-cols-12 gap-4 overflow-hidden ">
      {/* ---- Desktop Target Panel ---- */}
      <aside className="h-1/2  col-span-4 border rounded-xl p-4 bg-[var(--color-surface)]">
        <TargetSelector
          {...{
            targetType,
            classId,
            sectionId,
            studentId,
            classes,
            sections,
            students,
            resetCascade,
            setClassId,
            setSectionId,
            setStudentId,
          }}
        />
      </aside>

      {/* ---- Form ---- */}
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
