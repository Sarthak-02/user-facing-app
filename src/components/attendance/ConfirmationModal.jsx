import { Button, Card, Modal } from "../../ui-components";
import AttendanceSummary from "./AttendanceSummary";
import { useTranslation } from "react-i18next";

export default function ConfirmationModal({
  showConfirmation,
  setShowConfirmation,
  handleSubmit,
  isSubmitting = false,
  presentCount = 0,
  absentCount = 0,
  halfDayCount = 0,
  totalCount = 0,
}) {
  const { t } = useTranslation();
  return (
    <Modal open={showConfirmation} >
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("attendance.confirm.title")}</h2>

        <AttendanceSummary total={totalCount} present={presentCount} absent={absentCount} halfDay={halfDayCount} />

        <p className="text-sm text-gray-500">
          {t("attendance.confirm.message")}
        </p>

        <div className="flex gap-3 justify-end pt-2">
          <Button
            variant="secondary"
            disabled={isSubmitting}
            onClick={() => setShowConfirmation(false)}
          >
            {t("common.cancel")}
          </Button>

          <Button variant="primary" loading={isSubmitting} onClick={handleSubmit}>
            {t("attendance.confirm.submit")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
