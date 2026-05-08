import React, { useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const DateRange = ({
  startDate: externalStartDate,
  endDate: externalEndDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
  label,
  className = "",
  error = "",
  disabled = false,
}) => {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t("ui.dateRange.label");

  // Format date to YYYY-MM-DD for input value
  const formatDate = (date) => {
    if (!date) return "";
    return dayjs(date).format("YYYY-MM-DD");
  };

  const [validationError, setValidationError] = useState("");

  // Use controlled props if provided, otherwise show blank
  const startDate = externalStartDate ? formatDate(externalStartDate) : "";
  const endDate = externalEndDate ? formatDate(externalEndDate) : "";

  // Validate dates
  const validateDates = (start, end) => {
    if (!start || !end) {
      setValidationError("");
      return true;
    }

    const startDay = dayjs(start);
    const endDay = dayjs(end);

    if (startDay.isAfter(endDay)) {
      setValidationError(t("ui.dateRange.errorOrder"));
      return false;
    }

    if (minDate && startDay.isBefore(dayjs(minDate))) {
      setValidationError(
        t("ui.dateRange.errorStartBeforeMin", {
          date: dayjs(minDate).format("MMM DD, YYYY"),
        }),
      );
      return false;
    }

    if (maxDate && endDay.isAfter(dayjs(maxDate))) {
      setValidationError(
        t("ui.dateRange.errorEndAfterMax", {
          date: dayjs(maxDate).format("MMM DD, YYYY"),
        }),
      );
      return false;
    }

    setValidationError("");
    return true;
  };

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;

    if (validateDates(newStartDate, endDate)) {
      onStartDateChange?.(newStartDate);
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;

    if (validateDates(startDate, newEndDate)) {
      onEndDateChange?.(newEndDate);
    }
  };

  const inputClasses = `
    w-full px-3 py-2.5 min-h-[44px] border border-gray-300 rounded-md text-base
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `;

  return (
    <div className={`w-full ${className}`}>
      {/* Main Label */}
      {resolvedLabel && (
        <label className="block text-base font-medium text-gray-800 mb-2">
          {resolvedLabel}
        </label>
      )}

      {/* Bordered Container */}
      <div
        className={`border rounded-md p-4 ${validationError || error ? "border-red-500" : "border-gray-300"}`}
      >
        <div className="flex flex-row gap-2 items-end w-full">
          {/* Start Date Input */}
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("ui.dateRange.startDate")}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              min={minDate ? formatDate(minDate) : undefined}
              max={maxDate ? formatDate(maxDate) : undefined}
              disabled={disabled}
              className={inputClasses}
            />
          </div>

          {/* Separator - Centered Arrow */}
          <div className="flex items-center pb-2 text-gray-500 self-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>

          {/* End Date Input */}
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("ui.dateRange.endDate")}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              min={startDate || (minDate ? formatDate(minDate) : undefined)}
              max={maxDate ? formatDate(maxDate) : undefined}
              disabled={disabled}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Error Message */}
        {(validationError || error) && (
          <p className="mt-2 text-sm text-red-600">{validationError || error}</p>
        )}
      </div>
    </div>
  );
};

export default DateRange;
