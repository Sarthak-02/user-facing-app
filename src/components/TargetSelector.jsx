import Dropdown from "../ui-components/Dropdown";

const DEFAULT_TARGET_OPTIONS = [
  { value: "SCHOOL", label: "Entire School" },
  { value: "CLASS", label: "Class", multiple: false },
  { value: "SECTION", label: "Section", multiple: false },
  { value: "STUDENT", label: "Student", multiple: true },
];

export default function TargetSelector({
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
  TARGET_OPTIONS = DEFAULT_TARGET_OPTIONS,
}) {
  // Handle target type change with cascade reset
  const handleTargetTypeChange = (newTargetType) => {
    setTargetType(newTargetType);
    // Reset dependent selections when target type changes
    const targetOption = TARGET_OPTIONS.find((opt) => opt.value === newTargetType);
    setClassId(targetOption?.multiple ? [] : "");
    setSectionId(targetOption?.multiple ? [] : "");
    setStudentId(targetOption?.multiple ? [] : "");
  };

  // Get current target option config to determine if multi-select
  const currentTargetOption = TARGET_OPTIONS.find((opt) => opt.value === targetType);
  const isMultiple = currentTargetOption?.multiple || false;

  return (
    <div className="space-y-4 h-[20rem]">
      <Dropdown
        label="Target type"
        selected={targetType}
        onChange={handleTargetTypeChange}
        options={TARGET_OPTIONS}
        placeholder="Select target type"
      />

      {targetType !== "SCHOOL" && (
        <Dropdown
          label="Class"
          selected={classId}
          onChange={setClassId}
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
          multi={isMultiple}
          placeholder={isMultiple ? "Select classes" : "Select class"}
        />
      )}

      {(targetType === "SECTION" || targetType === "STUDENT") && (
        <Dropdown
          label="Section"
          selected={sectionId}
          onChange={setSectionId}
          options={sections.map((s) => ({ value: s.id, label: s.name }))}
          multi={isMultiple}
          placeholder={isMultiple ? "Select sections" : "Select section"}
        />
      )}

      {targetType === "STUDENT" && (
        <Dropdown
          label="Student"
          selected={studentId}
          onChange={setStudentId}
          options={students.map((s) => ({ value: s.id, label: s.name }))}
          multi={isMultiple}
          placeholder={isMultiple ? "Select students" : "Select student"}
        />
      )}
    </div>
  );
}
