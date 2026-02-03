import { create } from "zustand";

/**
 * Loader Store - Centralized state management for API loading states
 * 
 * Loader Types:
 * - 'spinner': Shows global overlay spinner (default)
 * - 'shimmer': For local shimmer effects (component handles display)
 * - 'silent': No UI indicator (for background operations)
 * 
 * Usage Examples:
 * 
 * 1. Global spinner loading:
 *    const { startLoading, stopLoading } = useLoader();
 *    startLoading('fetchUsers', 'spinner'); // or just startLoading('fetchUsers')
 *    // ... API call
 *    stopLoading('fetchUsers');
 * 
 * 2. Shimmer loading with options:
 *    // In API file (homework.api.js)
 *    export async function fetchHomework() {
 *      try {
 *        useLoader.getState().startLoading('fetchHomework', 'shimmer', { 
 *          variant: 'card-list', 
 *          count: 5 
 *        });
 *        const response = await api.get('/homework');
 *        useLoader.getState().stopLoading('fetchHomework');
 *        return response.data;
 *      } catch (err) {
 *        useLoader.getState().stopLoading('fetchHomework');
 *        throw err;
 *      }
 *    }
 * 
 *    // In component (Homework.jsx) - Option A: Using useShimmerLoader hook
 *    import { useShimmerLoader } from '@/store/loader.store';
 *    import Shimmer from '@/ui-components/Shimmer';
 *    
 *    const { isLoading, shimmerConfig } = useShimmerLoader('fetchHomework');
 *    
 *    return isLoading ? (
 *      <Shimmer {...shimmerConfig} />
 *    ) : (
 *      <div>Your homework list</div>
 *    );
 * 
 *    // Option B: Using useLoader directly
 *    const isLoading = useLoader((state) => state.isLoadingByKey('fetchHomework'));
 *    const shimmerConfig = useLoader((state) => state.getShimmerConfig('fetchHomework'));
 *    
 *    return isLoading ? (
 *      <Shimmer variant={shimmerConfig?.variant} count={shimmerConfig?.count} />
 *    ) : (
 *      <div>Your homework list</div>
 *    );
 * 
 * 3. Shimmer variants:
 *    // Card list (default)
 *    startLoading('fetchList', 'shimmer', { variant: 'card-list', count: 5 });
 *    
 *    // Detail page
 *    startLoading('fetchDetail', 'shimmer', { variant: 'detail' });
 *    
 *    // Table view
 *    startLoading('fetchTable', 'shimmer', { variant: 'table', count: 10 });
 * 
 * 4. Silent loading (no UI):
 *    startLoading('backgroundSync', 'silent');
 * 
 * 5. Check loader type:
 *    const { getLoaderType } = useLoader();
 *    const type = getLoaderType('fetchUsers'); // returns 'spinner', 'shimmer', 'silent', or null
 */

export const useLoader = create((set, get) => ({
  // Global loading state (for single loader use case)
  isLoading: false,
  
  // Object to track multiple loaders by key with their types and config
  // Structure: { 
  //   [key]: { 
  //     active: true, 
  //     type: 'spinner' | 'shimmer' | 'silent',
  //     shimmerConfig: { variant: 'card-list', count: 3, className: '' }
  //   } 
  // }
  loaders: {},
  
  /**
   * Start loading - can be used globally or with a specific key
   * @param {string} key - Optional key to track specific loader
   * @param {'spinner' | 'shimmer' | 'silent'} type - Type of loader (default: 'spinner')
   * @param {object} shimmerConfig - Shimmer configuration (only for type='shimmer')
   * @param {string} shimmerConfig.variant - 'card-list' | 'detail' | 'table' (default: 'card-list')
   * @param {number} shimmerConfig.count - Number of shimmer items (default: 3)
   * @param {string} shimmerConfig.className - Additional CSS classes
   */
  startLoading: (key, type = 'spinner', shimmerConfig = {}) => {
    if (key) {
      set((state) => ({
        loaders: { 
          ...state.loaders, 
          [key]: { 
            active: true, 
            type,
            ...(type === 'shimmer' && { shimmerConfig })
          } 
        }
      }));
    } else {
      set({ isLoading: true });
    }
  },
  
  /**
   * Stop loading - can be used globally or with a specific key
   * @param {string} key - Optional key to stop specific loader
   */
  stopLoading: (key) => {
    if (key) {
      set((state) => {
        const newLoaders = { ...state.loaders };
        delete newLoaders[key];
        return { loaders: newLoaders };
      });
    } else {
      set({ isLoading: false });
    }
  },
  
  /**
   * Check if a specific loader is active
   * @param {string} key - Loader key to check
   * @returns {boolean}
   */
  isLoadingByKey: (key) => {
    return !!get().loaders[key]?.active;
  },
  
  /**
   * Get the type of a specific loader
   * @param {string} key - Loader key
   * @returns {'spinner' | 'shimmer' | 'silent' | null}
   */
  getLoaderType: (key) => {
    return get().loaders[key]?.type || null;
  },
  
  /**
   * Get shimmer configuration for a specific loader
   * @param {string} key - Loader key
   * @returns {object | null} - Shimmer config or null
   */
  getShimmerConfig: (key) => {
    const loader = get().loaders[key];
    if (loader?.type === 'shimmer') {
      return loader.shimmerConfig || {};
    }
    return null;
  },
  
  /**
   * Check if any loader is currently active
   * @returns {boolean}
   */
  hasAnyLoader: () => {
    const state = get();
    return state.isLoading || Object.keys(state.loaders).length > 0;
  },
  
  /**
   * Check if any spinner-type loader is active
   * @returns {boolean}
   */
  hasSpinnerLoader: () => {
    const state = get();
    if (state.isLoading) return true;
    return Object.values(state.loaders).some(loader => loader.type === 'spinner');
  },
  
  /**
   * Reset all loaders
   */
  resetLoaders: () => {
    set({ isLoading: false, loaders: {} });
  },
  
  /**
   * Get all active loader keys
   * @returns {string[]}
   */
  getActiveLoaders: () => {
    return Object.keys(get().loaders);
  },
  
  /**
   * Get all active loaders by type
   * @param {'spinner' | 'shimmer' | 'silent'} type
   * @returns {string[]}
   */
  getActiveLoadersByType: (type) => {
    const loaders = get().loaders;
    return Object.entries(loaders)
      .filter(([_, loader]) => loader.type === type)
      .map(([key, _]) => key);
  }
}));

/**
 * Convenient hook to use shimmer loading in components
 * @param {string} key - Loader key
 * @returns {{ isLoading: boolean, shimmerConfig: object }}
 * 
 * @example
 * const { isLoading, shimmerConfig } = useShimmerLoader('fetchHomework');
 * 
 * return isLoading ? (
 *   <Shimmer {...shimmerConfig} />
 * ) : (
 *   <div>Your content</div>
 * );
 */
export const useShimmerLoader = (key) => {
  return useLoader((state) => ({
    isLoading: state.isLoadingByKey(key),
    shimmerConfig: state.getShimmerConfig(key) || {}
  }));
};
