# PWA Icons Guide

## Current Setup ✅

Your app now has all the required PWA icons:

- **pwa-192x192.png** (4.8KB) - Android home screen icon
- **pwa-512x512.png** (18KB) - Android splash screen icon
- **apple-touch-icon.png** (4.4KB) - iOS home screen icon
- **favicon.svg** (321B) - Browser tab icon
- **app-icon.svg** (833B) - Source icon for regeneration

## Placeholder Icons

The current icons are **blue placeholders** with "DS" (Digi School) text and a book icon. These are functional but should be replaced with your actual branding.

## How to Update Icons

### Option 1: Replace the SVG and Regenerate

1. Edit `public/app-icon.svg` with your logo design
2. Run: `npm run generate-icons`
3. All PNG files will be regenerated automatically

### Option 2: Replace PNG Files Directly

Simply replace the PNG files in the `public/` folder:
- `pwa-192x192.png` (192×192 pixels)
- `pwa-512x512.png` (512×512 pixels)
- `apple-touch-icon.png` (180×180 pixels)

## Design Guidelines

### Recommended Specifications:

- **Format**: PNG with transparency or solid background
- **Style**: Simple, recognizable design that works at small sizes
- **Colors**: High contrast for visibility
- **Safe zone**: Keep important elements in the center 80% of the icon

### Size Requirements:

| Icon | Size | Purpose |
|------|------|---------|
| pwa-192x192.png | 192×192px | Android home screen |
| pwa-512x512.png | 512×512px | Android splash screen |
| apple-touch-icon.png | 180×180px | iOS home screen |
| favicon.svg | Vector | Browser tab (scalable) |

## Testing Your PWA

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Preview locally:**
   ```bash
   npm run preview
   ```

3. **Test on mobile:**
   - Android Chrome: Look for "Install app" prompt or menu option
   - iOS Safari: Tap Share → "Add to Home Screen"

4. **Check icon appearance:**
   - The icon should appear on your home screen
   - Launch the app - it should open in standalone mode (no browser UI)

## Manifest Configuration

The PWA manifest is configured in `vite.config.js`:

```javascript
manifest: {
  name: "Digi School",
  short_name: "DigiSchool",
  description: "Attendance, homework & notifications for teachers",
  theme_color: "#2563eb",
  background_color: "#ffffff",
  display: "standalone",
  start_url: "/",
  icons: [...]
}
```

Update these values to match your branding.

## Troubleshooting

### Icons not updating after changes?
- Clear browser cache
- Uninstall and reinstall the PWA
- Check browser DevTools → Application → Manifest

### Install prompt not showing?
- Ensure you're using HTTPS (or localhost)
- Check that all required icons exist
- Verify service worker is registered
- Some browsers require user engagement before showing the prompt

### iOS-specific issues?
- iOS requires the `apple-touch-icon` in the HTML `<head>` (already added)
- iOS doesn't show automatic install prompts - users must manually add from Share menu
- iOS may cache icons aggressively - try clearing Safari cache
