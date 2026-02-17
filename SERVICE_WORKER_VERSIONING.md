# Service Worker Version Management

This project uses a version-based system to manage service worker unregistration on deployment.

## How It Works

The system automatically:
1. Stores the current service worker version in localStorage
2. Checks if the version has changed on each app load
3. Unregisters all service workers if the version changes
4. Registers the new service worker with the updated version

## Usage

### Normal Deployments (No SW Changes)

Just deploy as usual. The service worker will update automatically without unregistering.

### When You Need to Force Unregistration

Use one of these methods:

#### Method 1: Version Bump (Recommended for Production)

When you make breaking changes to your service worker, increment the version:

```env
# In .env (or your production env vars)
VITE_SW_VERSION=1.0.1  # Increment this
```

On the next deployment, all users will:
1. Have their old service workers unregistered
2. Get the new service worker registered
3. See console logs indicating the version change

#### Method 2: Force Unregister Flag (For Immediate Reset)

For immediate cleanup or debugging:

```env
# In .env (or your production env vars)
VITE_FORCE_SW_UNREGISTER=true
```

This will:
1. Unregister ALL service workers immediately
2. Reload the page automatically
3. Register the new service worker on reload

**⚠️ Remember to set this back to `false` after deployment!**

## Deployment Scenarios

### Scenario 1: Regular Updates (No SW Changes)
```bash
# Just deploy - no action needed
npm run build
# deploy...
```

### Scenario 2: Service Worker Code Changes
```bash
# Update version in .env or production env
VITE_SW_VERSION=1.1.0

# Build and deploy
npm run build
# deploy...
```

### Scenario 3: Emergency SW Cleanup
```bash
# Set force flag
VITE_FORCE_SW_UNREGISTER=true

# Build and deploy
npm run build
# deploy...

# After deployment succeeds, reset the flag:
VITE_FORCE_SW_UNREGISTER=false
```

## Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_SW_VERSION` | string | `1.0.0` | Current service worker version. Increment to trigger unregistration. |
| `VITE_FORCE_SW_UNREGISTER` | boolean | `false` | Force unregister all SWs and reload page. Use for debugging. |

## Console Logs

The system provides detailed console logs:

- `📱 Current SW version: X.X.X` - Shows active version
- `🔄 SW version changed: X.X.X → Y.Y.Y` - Version change detected
- `🗑️ Unregistering N service worker(s)...` - Unregistration in progress
- `✅ All service workers unregistered successfully` - Unregistration complete
- `✅ Service Worker registered successfully` - New SW registered

## Manual Unregistration (Developer Console)

For debugging, you can manually trigger unregistration:

```javascript
// Import the utility
import { manualUnregister } from './utils/sw-version-manager.js';

// Unregister all service workers
await manualUnregister();
```

Or directly in browser console:
```javascript
// Get all registrations and unregister them
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('All service workers unregistered');
});
```

## Version Strategy

Follow semantic versioning:

- **Patch** (1.0.0 → 1.0.1): Minor SW updates, bug fixes
- **Minor** (1.0.0 → 1.1.0): New SW features, non-breaking changes  
- **Major** (1.0.0 → 2.0.0): Breaking SW changes, major rewrites

## Troubleshooting

### Service worker not unregistering?

1. Check browser console for error messages
2. Verify `VITE_SW_VERSION` is actually changing
3. Clear browser cache and localStorage manually
4. Use `VITE_FORCE_SW_UNREGISTER=true` for forced cleanup

### Version not updating?

1. Make sure environment variables are loaded during build
2. Check that `.env` changes are committed/deployed
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)

### Multiple service workers still present?

1. Set `VITE_FORCE_SW_UNREGISTER=true`
2. Rebuild and redeploy
3. After users reload, set it back to `false`

## Best Practices

1. **Document SW changes**: Update version in git commit when changing SW code
2. **Test locally**: Change version locally to test unregistration flow
3. **Monitor logs**: Check browser console on deployment to verify behavior
4. **Gradual rollout**: For major SW changes, consider a staged rollout
5. **Keep history**: Log version changes in CHANGELOG.md
