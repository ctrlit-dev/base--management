import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BackgroundType = 'default' | 'minimal' | 'cosmic' | 'geometric' | 'particles' | 'gradient';

interface BackgroundState {
  backgroundType: BackgroundType;
  setBackgroundType: (type: BackgroundType) => void;
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set) => ({
      backgroundType: 'default',
      setBackgroundType: (type: BackgroundType) => {
        set({ backgroundType: type });
      },
    }),
    {
      name: 'lcree-background',
    }
  )
);
