export default function TargetSelector({
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
}) {
  return (
    <div className="space-y-4">
      <Select
        label="Target type"
        value={targetType}
        onChange={resetCascade}
        options={[
          { value: "SCHOOL", label: "Entire School" },
          { value: "CLASS", label: "Class" },
          { value: "SECTION", label: "Section" },
          { value: "STUDENT", label: "Student" },
        ]}
      />

      {targetType !== "SCHOOL" && (
        <Select
          label="Class"
          value={classId}
          onChange={setClassId}
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
        />
      )}

      {(targetType === "SECTION" || targetType === "STUDENT") && (
        <Select
          label="Section"
          value={sectionId}
          onChange={setSectionId}
          disabled={!classId}
          options={sections.map((s) => ({ value: s.id, label: s.name }))}
        />
      )}

      {targetType === "STUDENT" && (
        <Select
          label="Student"
          value={studentId}
          onChange={setStudentId}
          disabled={!sectionId}
          options={students.map((s) => ({ value: s.id, label: s.name }))}
        />
      )}
    </div>
  );
}

/* ---------------- UI primitives ---------------- */

function Select({ label, value, onChange, options, disabled }) {
  return (
    <div>
      <label className="text-xs font-semibold">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
