/**
 * Categories for school broadcasts / announcements (sent as `category` string on create/update API).
 * Use `labelKey` with i18n — keys under `announcementCategories.*`.
 */
export const ANNOUNCEMENT_CATEGORY_OPTIONS = [
  { labelKey: "announcementCategories.general", value: "general" },
  { labelKey: "announcementCategories.sports", value: "sports" },
  { labelKey: "announcementCategories.fun", value: "fun" },
  { labelKey: "announcementCategories.urgent", value: "urgent" },
  { labelKey: "announcementCategories.academic", value: "academic" },
  { labelKey: "announcementCategories.events", value: "events" },
];

export const DEFAULT_ANNOUNCEMENT_CATEGORY = ANNOUNCEMENT_CATEGORY_OPTIONS[0];

export function announcementCategoryOptionFromValue(value) {
  const v = String(value || "general").toLowerCase();
  return (
    ANNOUNCEMENT_CATEGORY_OPTIONS.find((o) => o.value === v) ||
    DEFAULT_ANNOUNCEMENT_CATEGORY
  );
}
