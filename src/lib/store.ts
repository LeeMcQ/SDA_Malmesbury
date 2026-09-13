import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "paper" | "night";

type AppState = {
  favorites: string[];
  recent: string[];
  planner: string[];
  fontScale: number;
  theme: Theme;
  toggleFavorite: (id: string) => void;
  addRecent: (id: string) => void;
  addToPlanner: (id: string) => void;
  removeFromPlanner: (id: string) => void;
  movePlanner: (id: string, dir: -1 | 1) => void;
  clearPlanner: () => void;
  setFontScale: (n: number) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

export const FONT_STEPS = [0.9, 1, 1.15, 1.35, 1.55];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      favorites: [],
      recent: [],
      planner: [],
      fontScale: 1,
      theme: "paper",
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((item) => item !== id)
            : [id, ...state.favorites],
        })),
      addRecent: (id) =>
        set((state) => ({
          recent: [id, ...state.recent.filter((item) => item !== id)].slice(0, 8),
        })),
      addToPlanner: (id) =>
        set((state) => ({
          planner: state.planner.includes(id) ? state.planner : [...state.planner, id],
        })),
      removeFromPlanner: (id) =>
        set((state) => ({
          planner: state.planner.filter((item) => item !== id),
        })),
      movePlanner: (id, dir) =>
        set((state) => {
          const list = [...state.planner];
          const index = list.indexOf(id);
          const next = index + dir;
          if (index < 0 || next < 0 || next >= list.length) return state;
          const swap = list[next]!;
          list[next] = list[index]!;
          list[index] = swap;
          return { planner: list };
        }),
      clearPlanner: () => set({ planner: [] }),
      setFontScale: (n) => set({ fontScale: n }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "paper" ? "night" : "paper" })),
    }),
    { name: "malmesbury-praise" },
  ),
);
