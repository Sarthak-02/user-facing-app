import Dropdown from "../ui-components/Dropdown";

const DEFAULT_TARGET_OPTIONS = [
  { value: "SCHOOL", label: "Entire School" },
  { value: "CLASS", label: "Class", multiple: false },
  { value: "SECTION", label: "Section", multiple: false },
  { value: "STUDENT", label: "Student", multiple: true },
];



export default function TargetSelector({
  targetType,
  handleTargetTypeChange,
  TARGET_OPTIONS = DEFAULT_TARGET_OPTIONS,
  schema = [],
}) {

  console.log("schema", schema);
  return (
    <div className="space-y-4">
      <Dropdown
        label="Target type"
        selected={targetType}
        onChange={handleTargetTypeChange}
        options={TARGET_OPTIONS}
        placeholder="Select target type"
      />
      <div className="space-y-4 h-[20rem]">
        {schema?.map((item) => (
          <Dropdown key={item?.type} {...item} />
        ))}
      </div>
    </div>

  )
}
