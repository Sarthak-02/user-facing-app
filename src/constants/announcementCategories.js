/**
 * Categories for school broadcasts / announcements (sent as `category` string on create/update API).
 */
export const ANNOUNCEMENT_CATEGORY_OPTIONS = [
  { label: "General", value: "general" },
  { label: "Sports", value: "sports" },
  { label: "Fun", value: "fun" },
  { label: "Urgent", value: "urgent" },
  { label: "Academic", value: "academic" },
  { label: "Events", value: "events" },
];

export const DEFAULT_ANNOUNCEMENT_CATEGORY = ANNOUNCEMENT_CATEGORY_OPTIONS[0];

export function announcementCategoryOptionFromValue(value) {
  const v = String(value || "general").toLowerCase();
  return (
    ANNOUNCEMENT_CATEGORY_OPTIONS.find((o) => o.value === v) ||
    DEFAULT_ANNOUNCEMENT_CATEGORY
  );
}
