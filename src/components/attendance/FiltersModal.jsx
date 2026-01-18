import { useState } from "react";
import { Button, Modal, Select } from "../../ui-components";
import { SlidersHorizontal } from "lucide-react";

const CAMPUS_SESSION_OPTIONS = [
  { label: "Full Day", value: "FULL_DAY" },
  { label: "Morning", value: "MORNING" },
  { label: "Afternoon", value: "AFTERNOON" },
];

const PERIOD_OPTIONS = [
  { label: "Overall", value: "OVERALL" },
  { label: "Period 1", value: "PERIOD_1" },
  { label: "Period 2", value: "PERIOD_2" },
  { label: "Period 3", value: "PERIOD_3" },
  { label: "Period 4", value: "PERIOD_4" },
  { label: "Period 5", value: "PERIOD_5" },
  { label: "Period 6", value: "PERIOD_6" },
  { label: "Period 7", value: "PERIOD_7" },
  { label: "Period 8", value: "PERIOD_8" },
];

export default function FiltersModal({
  campusSession,
  setCampusSession,
  period,
  setPeriod,
}) {
  const [showModal, setShowModal] = useState(false);

  const handleApply = () => {
    setShowModal(false);
  };

  const handleReset = () => {
    setCampusSession("FULL_DAY");
    setPeriod("OVERALL");
  };

  return (
    <>
      {/* Mobile: Filter Button that opens modal */}
      <button
        onClick={() => setShowModal(true)}
        className="md:hidden inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-gray-700 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-primary-600"
      >
        <SlidersHorizontal size={18} />
        {/* <span>Filters</span> */}
      </button>

      {/* Desktop: Inline filters */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Session:
          </label>
          <Select
            value={campusSession}
            onChange={(e) => setCampusSession(e.target.value)}
            options={CAMPUS_SESSION_OPTIONS}
            className="min-w-[140px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Period:
          </label>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={PERIOD_OPTIONS}
            className="min-w-[140px]"
          />
        </div>
      </div>

      {/* Mobile: Modal */}
      <Modal open={showModal}>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button
              onClick={handleReset}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Reset All
            </button>
          </div>

          {/* Campus Session Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Campus Session
            </label>
            <Select
              value={campusSession}
              onChange={(e) => setCampusSession(e.target.value)}
              options={CAMPUS_SESSION_OPTIONS}
            />
          </div>

          {/* Period Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Period
            </label>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={PERIOD_OPTIONS}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
