import api from "./axios";
import i18n from "../i18n";

/**
 * Normalize GET /receiver/summary body: supports `{ success, data }` or a direct summary object.
 * @param {object} res - Parsed JSON body from the API
 * @returns {{ payload: object | null, message: string | null }}
 */
export function unwrapReceiverSummaryResponse(res) {
  if (!res || typeof res !== "object") {
    return { payload: null, message: i18n.t("errors.summaryCouldNotLoad") };
  }
  if (res.success === false) {
    return {
      payload: null,
      message: typeof res.message === "string" ? res.message : i18n.t("errors.summaryCouldNotLoad"),
    };
  }

  const d = res.data;
  const dataLooksLikeSummary =
    d &&
    typeof d === "object" &&
    (d.receiverId != null ||
      d.timetable != null ||
      d.section != null ||
      d.homework != null ||
      Array.isArray(d.homeworkDueNext7Days));

  if (res.success === true && dataLooksLikeSummary) {
    return { payload: d, message: null };
  }
  if (dataLooksLikeSummary && res.success !== false) {
    return { payload: d, message: null };
  }

  const rootLooksLikeSummary =
    res.receiverId != null ||
    res.timetable != null ||
    res.section != null ||
    res.homework != null ||
    Array.isArray(res.homeworkDueNext7Days);

  if (rootLooksLikeSummary) {
    return { payload: res, message: null };
  }

  return {
    payload: null,
    message: typeof res.message === "string" ? res.message : i18n.t("errors.summaryCouldNotLoad"),
  };
}

/**
 * Student home / dashboard summary (timetable, homework, broadcasts, attendance).
 * @param {Object} params
 * @param {string} params.receiverId - Student user id
 * @param {string} params.sectionId - Section id
 * @param {string} params.campusId - Campus id
 * @returns {Promise<object>} Raw response body (use {@link unwrapReceiverSummaryResponse} to read payload)
 */
export async function getReceiverSummary({ receiverId, sectionId, campusId }) {
  const response = await api.get("/receiver/summary", {
    params: { receiverId, sectionId, campusId },
  });
  return response.data;
}
