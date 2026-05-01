import Dropdown from "../ui-components/Dropdown";
import { useTranslation } from "react-i18next";

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

  const { t } = useTranslation();
  console.log("schema", schema);
  return (
    <div className="space-y-4">
      <Dropdown
        label={t("targetSelector.label")}
        selected={targetType}
        onChange={handleTargetTypeChange}
        options={TARGET_OPTIONS}
        placeholder={t("targetSelector.placeholder")}
        
      />
      <div className="space-y-4 h-[20rem]">
        {schema?.map((item) => (
          <Dropdown key={item?.type} {...item} />
        ))}
      </div>
    </div>

  )
}
