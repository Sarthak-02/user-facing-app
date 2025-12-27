import { Button, Card, Modal } from "../../ui-components";
import AttendanceSummary from "./AttendanceSummary";

export default function ConfirmationModal({
  showConfirmation,
  setShowConfirmation,
  handleSubmit,
  presentCount = 10,
  absentCount = 20,
}) {
  return (
    <Modal open={showConfirmation} >
      <div className="space-y-4">
        {/* Title */}
        <h2 className="text-lg font-semibold">Confirm Attendance</h2>

        {/* Summary */}
        <AttendanceSummary total={50} present={presentCount} absent={absentCount}/>

        {/* Info text */}
        <p className="text-sm text-gray-500">
          Please review the attendance before submitting. Once submitted, attendance
          cannot be edited.
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button
            variant="secondary"
            onClick={() => setShowConfirmation(false)}
          >
            Cancel
          </Button>

          <Button variant="primary" onClick={handleSubmit}>
            Submit Attendance
          </Button>
        </div>
      </div>
    </Modal>
  );
}
