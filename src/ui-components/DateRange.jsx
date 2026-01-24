import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import Modal from './Modal';

const DateRange = ({
  startDate: externalStartDate,
  endDate: externalEndDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
  label = 'Date Range',
  className = '',
  error = '',
  disabled = false,
}) => {
  
  // Format date to YYYY-MM-DD for input value
  const formatDate = (date) => {
    if (!date) return '';
    return dayjs(date).format('YYYY-MM-DD');
  };

  // Get today's date as default
  const today = dayjs().format('YYYY-MM-DD');

  const [validationError, setValidationError] = useState('');

  // Use controlled props if provided, otherwise use today as default
  const startDate = externalStartDate ? formatDate(externalStartDate) : today;
  const endDate = externalEndDate ? formatDate(externalEndDate) : today;

  // Validate dates
  const validateDates = (start, end) => {
    if (!start || !end) {
      setValidationError('');
      return true;
    }

    const startDay = dayjs(start);
    const endDay = dayjs(end);

    if (startDay.isAfter(endDay)) {
      setValidationError('Start date must be before or equal to end date');
      return false;
    }

    if (minDate && startDay.isBefore(dayjs(minDate))) {
      setValidationError(`Start date cannot be before ${dayjs(minDate).format('MMM DD, YYYY')}`);
      return false;
    }

    if (maxDate && endDay.isAfter(dayjs(maxDate))) {
      setValidationError(`End date cannot be after ${dayjs(maxDate).format('MMM DD, YYYY')}`);
      return false;
    }

    setValidationError('');
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
    w-full px-3 py-2 border border-gray-300 rounded-md text-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `;

  return (
    <div className={`w-full ${className}`}>
      {/* Main Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Bordered Container */}
      <div className={`border rounded-md p-4 ${validationError || error ? 'border-red-500' : 'border-gray-300'}`}>
        <div className="flex flex-row gap-2 items-end w-full">
          {/* Start Date Input */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Start Date
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
          <div className="flex items-center pb-2 text-gray-400">
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
            <label className="block text-xs font-medium text-gray-600 mb-1">
              End Date
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
          <p className="mt-2 text-sm text-red-600">
            {validationError || error}
          </p>
        )}
      </div>
    </div>
  );
};

export default DateRange;
