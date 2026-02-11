import { create } from 'zustand';

interface InfraState {
  isRunning: boolean;
  totalMinutesUsed: number;
  dailyLimit: number;
  setRunning: (running: boolean) => void;
  setUsage: (minutes: number) => void;
}

export const useInfraStore = create<InfraState>((set) => ({
  isRunning: false,
  totalMinutesUsed: 0,
  dailyLimit: 1440, // 24 hours in minutes (프리티어 기본값)
  setRunning: (running) => set({ isRunning: running }),
  setUsage: (minutes) => set({ totalMinutesUsed: minutes }),
}));
