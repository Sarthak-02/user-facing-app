/**
 * Default icon/badge URLs for Web Push and the Notification API.
 * Uses Vite BASE_URL so assets resolve when the app is served under a subpath (e.g. /app/).
 */
const base = import.meta.env.BASE_URL ?? "/";
const normalizedBase = base.endsWith("/") ? base : `${base}/`;

export const DEFAULT_NOTIFICATION_ICON_URL = `${normalizedBase}pwa-192x192.png`;
export const DEFAULT_NOTIFICATION_BADGE_URL = DEFAULT_NOTIFICATION_ICON_URL;
