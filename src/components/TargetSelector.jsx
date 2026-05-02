import { useMemo } from "react";
import Dropdown from "../ui-components/Dropdown";
import { useTranslation } from "react-i18next";

const DEFAULT_TARGET_OPTIONS = [
  { value: "SCHOOL", label: "", multiple: false },
  { value: "CLASS", label: "", multiple: false },
  { value: "SECTION", label: "", multiple: false },
  { value: "STUDENT", label: "", multiple: true },
];

const TARGET_LABEL_KEYS = {
  SCHOOL: "targetSelector.entireSchool",
  CLASS: "targetSelector.class",
  SECTION: "targetSelector.section",
  STUDENT: "targetSelector.student",
};

function mapTargetOptions(options, t) {
  return options.map((opt) => {
    const key = TARGET_LABEL_KEYS[opt.value];
    return key ? { ...opt, label: t(key) } : opt;
  });
}

export default function TargetSelector({
  targetType,
  handleTargetTypeChange,
  TARGET_OPTIONS = DEFAULT_TARGET_OPTIONS,
  schema = [],
}) {
  const { t } = useTranslation();
  const translatedTargetOptions = useMemo(
    () => mapTargetOptions(TARGET_OPTIONS, t),
    [TARGET_OPTIONS, t]
  );

  return (
    <div className="space-y-4">
      <Dropdown
        label={t("targetSelector.label")}
        selected={targetType}
        onChange={handleTargetTypeChange}
        options={translatedTargetOptions}
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
