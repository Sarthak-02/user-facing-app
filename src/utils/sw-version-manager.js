/**
 * Service Worker Version Manager
 * Handles versioning and unregistration of old service workers
 */

const SW_VERSION_KEY = 'sw_version';
const CURRENT_SW_VERSION = import.meta.env.VITE_SW_VERSION || '1.0.0';
const FORCE_UNREGISTER = import.meta.env.VITE_FORCE_SW_UNREGISTER === 'true';

/**
 * Get the stored service worker version
 */
export function getStoredVersion() {
  try {
    return localStorage.getItem(SW_VERSION_KEY);
  } catch (error) {
    console.error('Error reading SW version:', error);
    return null;
  }
}

/**
 * Store the current service worker version
 */
export function setStoredVersion(version) {
  try {
    localStorage.setItem(SW_VERSION_KEY, version);
  } catch (error) {
    console.error('Error storing SW version:', error);
  }
}

/**
 * Check if service worker version has changed
 */
export function hasVersionChanged() {
  const storedVersion = getStoredVersion();
  return storedVersion !== null && storedVersion !== CURRENT_SW_VERSION;
}

/**
 * Unregister all service workers
 */
export async function unregisterAllServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker API not supported');
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length === 0) {
      console.log('📭 No service workers to unregister');
      return true;
    }

    console.log(`🗑️ Unregistering ${registrations.length} service worker(s)...`);
    
    const results = await Promise.all(
      registrations.map(async (registration) => {
        const success = await registration.unregister();
        if (success) {
          console.log('✅ Unregistered SW:', registration.scope);
        } else {
          console.warn('⚠️ Failed to unregister SW:', registration.scope);
        }
        return success;
      })
    );

    const allUnregistered = results.every(result => result === true);
    
    if (allUnregistered) {
      console.log('✅ All service workers unregistered successfully');
    } else {
      console.warn('⚠️ Some service workers failed to unregister');
    }
    
    return allUnregistered;
  } catch (error) {
    console.error('❌ Error unregistering service workers:', error);
    return false;
  }
}

/**
 * Check if we should unregister service workers
 */
export function shouldUnregisterServiceWorkers() {
  // Force unregister if environment variable is set
  if (FORCE_UNREGISTER) {
    console.log('🔄 Force unregister flag is set');
    return true;
  }

  // Unregister if version has changed
  if (hasVersionChanged()) {
    console.log(`🔄 SW version changed: ${getStoredVersion()} → ${CURRENT_SW_VERSION}`);
    return true;
  }

  return false;
}

/**
 * Main function to handle service worker versioning
 * Call this before registering new service workers
 */
export async function handleServiceWorkerVersion() {
  console.log(`📱 Current SW version: ${CURRENT_SW_VERSION}`);
  console.log(`📱 Stored SW version: ${getStoredVersion() || 'none'}`);

  if (shouldUnregisterServiceWorkers()) {
    console.log('🔄 Unregistering old service workers...');
    const success = await unregisterAllServiceWorkers();
    
    if (success) {
      // Update stored version
      setStoredVersion(CURRENT_SW_VERSION);
      console.log('✅ SW version updated to:', CURRENT_SW_VERSION);
      
      // Optionally reload the page to ensure clean state
      if (FORCE_UNREGISTER) {
        console.log('🔄 Reloading page for clean state...');
        window.location.reload();
        return false; // Don't continue registration in current page load
      }
    }
  } else {
    // Version hasn't changed, just update if not set
    if (!getStoredVersion()) {
      setStoredVersion(CURRENT_SW_VERSION);
    }
  }

  return true; // Continue with registration
}

/**
 * Utility to manually trigger unregistration (for debugging)
 */
export async function manualUnregister() {
  console.log('🔧 Manual unregister triggered');
  const success = await unregisterAllServiceWorkers();
  if (success) {
    setStoredVersion(CURRENT_SW_VERSION);
  }
  return success;
}

// Export current version for debugging
export const currentVersion = CURRENT_SW_VERSION;
