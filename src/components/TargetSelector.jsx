import { useMemo } from "react";
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

/** Schema row types from `target.schema.js`; labels were English-only before i18n. */
const SCHEMA_FIELD_I18N = {
  class: "targetSelector.selectClass",
  section: "targetSelector.selectSection",
  student: "targetSelector.selectStudent",
};

function mapTargetOptions(options, t) {
  return options.map((opt) => {
    const key = TARGET_LABEL_KEYS[opt.value];
    return key ? { ...opt, label: t(key) } : opt;
  });
}

function NativeSelect({
  label,
  options = [],
  multi = false,
  placeholder,
  selected,
  onChange,
  disabled = false,
  required = false,
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("ui.selectPlaceholder");

  const value = multi ? (selected || []).map((s) => s.value) : selected?.value || "";

  return (
    <div className="w-full">
      {label && <label className="block mb-1 text-sm text-gray-600">{label}</label>}
      <select
        value={value}
        multiple={multi}
        disabled={disabled}
        required={required}
        onChange={(e) => {
          if (multi) {
            const values = Array.from(e.target.selectedOptions).map((o) => o.value);
            const mapped = values
              .map((v) => options.find((o) => o.value === v) || { value: v, label: v })
              .filter(Boolean);
            onChange(mapped);
          } else {
            const v = e.target.value;
            const option = options.find((o) => o.value === v) || (v ? { value: v, label: v } : null);
            onChange(option);
          }
        }}
        className="w-full border bg-white px-3 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {!multi && (
          <option value="" disabled>
            {resolvedPlaceholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
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
      <NativeSelect
        label={t("targetSelector.label")}
        selected={targetType}
        onChange={handleTargetTypeChange}
        options={translatedTargetOptions}
        placeholder={t("targetSelector.placeholder")}
      />
      <div className="space-y-4 h-[20rem]">
        {schema?.map((item) => {
          const fieldKey = SCHEMA_FIELD_I18N[item?.type];
          const label = fieldKey ? t(fieldKey) : item.label;
          const placeholder = fieldKey ? t(fieldKey) : item.placeholder ?? t("ui.selectPlaceholder");
          return (
            <NativeSelect
              key={item?.type}
              {...item}
              label={label}
              placeholder={placeholder}
            />
          );
        })}
      </div>
    </div>

  )
}
