import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function Dropdown({
  label,
  options = [],
  multi = false,
  placeholder,
  selected,
  onChange,
  width = "w-full",
  maxHeight = "max-h-72",
  error = false,
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("ui.selectPlaceholder");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const ref = useRef(null);

  // When multi=true the parent may pass null/object before any selection; normalise to array.
  const safeSelected = multi ? (Array.isArray(selected) ? selected : []) : selected;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (multi) {
      const isSelected = safeSelected.some((item) => item.value === option.value);
      if (isSelected) {
        onChange(safeSelected.filter((item) => item.value !== option.value));
      } else {
        onChange([...safeSelected, option]);
      }
    } else {
      onChange(option);
      setOpen(false);
    }
  };

  const renderLabel = () => {
    if (multi) {
      if (!safeSelected.length) return resolvedPlaceholder;
      return safeSelected.map((item) => item.label).join(", ");
    }

    return selected ? selected.label : resolvedPlaceholder;
  };

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = () => {
    const allSelected = filteredOptions.every((opt) =>
      safeSelected.some((item) => item.value === opt.value)
    );

    if (allSelected) {
      const remainingSelected = safeSelected.filter(
        (item) => !filteredOptions.some((opt) => opt.value === item.value)
      );
      onChange(remainingSelected);
    } else {
      const newSelections = [...safeSelected];
      filteredOptions.forEach((opt) => {
        if (!newSelections.some((item) => item.value === opt.value)) {
          newSelections.push(opt);
        }
      });
      onChange(newSelections);
    }
  };

  const allFilteredSelected = multi && filteredOptions.length > 0 &&
    filteredOptions.every((opt) => safeSelected.some((item) => item.value === opt.value));

  return (
    <div className={`${width} relative`} ref={ref}>
      {label && (
        <label className="block mb-1 text-sm text-gray-600">{label}</label>
      )}

      {/* Trigger + Clear Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen((prev) => !prev);
            setSearchQuery("");
          }}
          className={`w-full border ${error && "border-red-500"} bg-white px-3 py-2 rounded-lg 
            text-left flex justify-between items-center pr-10`}
        >
          <span className="text-gray-800 truncate">{renderLabel()}</span>
          <span className="text-gray-500 ml-2">▼</span>
        </button>

        {(multi ? safeSelected.length > 0 : selected) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(multi ? [] : null);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown List */}
      {open && (
        <div className={`absolute z-20 mt-2 w-full bg-white shadow-lg border rounded-lg ${maxHeight} overflow-y-auto`}>
          
          {/* Search Bar */}
          <div className="p-2 border-b">
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("ui.searchPlaceholder")}
              className="w-full px-2 py-1 border rounded text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Select All Option (multi-select only) */}
          {multi && filteredOptions.length > 0 && (
            <div
              onClick={handleSelectAll}
              className="px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-gray-100 border-b bg-gray-50 font-medium text-sm"
            >
              <span className="text-blue-600">
                {allFilteredSelected ? t("ui.deselectAll") : t("ui.selectAll")}
              </span>
              {allFilteredSelected && (
                <span className="text-blue-600 text-sm font-bold">✓</span>
              )}
            </div>
          )}

          {/* Options */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const active = multi
                ? safeSelected.some((item) => item.value === opt.value)
                : selected?.value === opt.value;

              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-gray-100 ${
                    active ? "bg-blue-50" : ""
                  }`}
                >
                  <span className="text-gray-900">{opt.label}</span>
                  {active && (
                    <span className="text-blue-600 text-sm font-bold">✓</span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-3 py-2 text-gray-500 text-sm italic">
              {t("ui.noResults")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
