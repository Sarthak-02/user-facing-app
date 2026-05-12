import { useEffect, useCallback, useRef } from "react";
import { useAttendanceDraft } from "../store/attendanceDraft.store";
import { submitAttendance, editAttendance, checkAttendanceTaken } from "../api/attendance.api";

const MAX_RETRIES = 3;

export function usePendingSync({ onSyncSuccess, onConflict } = {}) {
  const { removeSubmission, incrementRetry, clearDraft } = useAttendanceDraft();

  // Use refs so syncPending stays stable while always calling latest callbacks
  const onSyncSuccessRef = useRef(onSyncSuccess);
  const onConflictRef = useRef(onConflict);
  useEffect(() => { onSyncSuccessRef.current = onSyncSuccess; }, [onSyncSuccess]);
  useEffect(() => { onConflictRef.current = onConflict; }, [onConflict]);

  const syncPending = useCallback(async () => {
    if (!navigator.onLine) return;

    const toSync = useAttendanceDraft
      .getState()
      .pendingSubmissions.filter((s) => s.retryCount < MAX_RETRIES);

    if (toSync.length === 0) return;

    for (const submission of toSync) {
      try {
        const alreadyTaken = await checkAttendanceTaken(submission.sectionId, submission.date);

        if (alreadyTaken && submission.type === "submit") {
          removeSubmission(submission.id);
          clearDraft(submission.sectionId, submission.date);
          onConflictRef.current?.(submission);
          continue;
        }

        const response =
          submission.type === "edit"
            ? await editAttendance(submission.payload)
            : await submitAttendance(submission.payload);

        if (response?.success) {
          removeSubmission(submission.id);
          clearDraft(submission.sectionId, submission.date);
          onSyncSuccessRef.current?.(submission);
        } else {
          incrementRetry(submission.id);
        }
      } catch {
        incrementRetry(submission.id);
      }
    }
  }, [removeSubmission, incrementRetry, clearDraft]);

  useEffect(() => {
    window.addEventListener("online", syncPending);
    return () => window.removeEventListener("online", syncPending);
  }, [syncPending]);

  // Attempt sync on mount in case the app restarted while submissions were pending
  useEffect(() => {
    if (navigator.onLine) syncPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
