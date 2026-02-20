import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CoursePlayerState {
  // Existing
  currentLessonId: string | null;
  isSidebarOpen: boolean;
  playbackSpeed: number;
  videoProgress: number;
  // New
  isTheaterMode: boolean;
  autoPlayNext: boolean;
  showBookmarksPanel: boolean;
  captionLanguage: "off" | "en" | "ar";
  qualityLevel: number; // -1 = auto
  showCompletionCelebration: boolean;
  sidebarSearchQuery: string;

  // Actions
  setCurrentLesson: (lessonId: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setVideoProgress: (progress: number) => void;
  setTheaterMode: (enabled: boolean) => void;
  toggleTheaterMode: () => void;
  setAutoPlayNext: (enabled: boolean) => void;
  toggleBookmarksPanel: () => void;
  setCaptionLanguage: (lang: "off" | "en" | "ar") => void;
  setQualityLevel: (level: number) => void;
  setShowCompletionCelebration: (show: boolean) => void;
  setSidebarSearchQuery: (query: string) => void;
}

export const useCoursePlayerStore = create<CoursePlayerState>()(
  persist(
    (set) => ({
      // Existing defaults
      currentLessonId: null,
      isSidebarOpen: true,
      playbackSpeed: 1,
      videoProgress: 0,
      // New defaults
      isTheaterMode: false,
      autoPlayNext: true,
      showBookmarksPanel: false,
      captionLanguage: "off" as const,
      qualityLevel: -1,
      showCompletionCelebration: false,
      sidebarSearchQuery: "",

      // Actions
      setCurrentLesson: (lessonId) => set({ currentLessonId: lessonId }),
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
      setVideoProgress: (progress) => set({ videoProgress: progress }),
      setTheaterMode: (enabled) => set({ isTheaterMode: enabled }),
      toggleTheaterMode: () =>
        set((state) => ({ isTheaterMode: !state.isTheaterMode })),
      setAutoPlayNext: (enabled) => set({ autoPlayNext: enabled }),
      toggleBookmarksPanel: () =>
        set((state) => ({ showBookmarksPanel: !state.showBookmarksPanel })),
      setCaptionLanguage: (lang) => set({ captionLanguage: lang }),
      setQualityLevel: (level) => set({ qualityLevel: level }),
      setShowCompletionCelebration: (show) =>
        set({ showCompletionCelebration: show }),
      setSidebarSearchQuery: (query) => set({ sidebarSearchQuery: query }),
    }),
    {
      name: "vifm-course-player",
      partialize: (state) =>
        ({
          isTheaterMode: state.isTheaterMode,
          autoPlayNext: state.autoPlayNext,
          captionLanguage: state.captionLanguage,
          playbackSpeed: state.playbackSpeed,
        }) as Partial<CoursePlayerState>,
    }
  )
);
