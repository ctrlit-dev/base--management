/**
 * Navigation Store
 * ================
 * 
 * Zustand für Navigation-spezifische Einstellungen
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NavigationState {
  isStickyNavigation: boolean;
  setStickyNavigation: (isSticky: boolean) => void;
  toggleStickyNavigation: () => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      isStickyNavigation: true, // Standard: Navigation ist sticky
      
      setStickyNavigation: (isSticky: boolean) => {
        set({ isStickyNavigation: isSticky });
      },
      
      toggleStickyNavigation: () => {
        set((state) => ({ isStickyNavigation: !state.isStickyNavigation }));
      },
    }),
    {
      name: 'lcree-navigation-settings',
      version: 1,
    }
  )
);
