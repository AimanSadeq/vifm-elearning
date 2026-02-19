import { create } from "zustand";

interface CoursePlayerState {
  currentLessonId: string | null;
  isSidebarOpen: boolean;
  playbackSpeed: number;
  videoProgress: number;
  setCurrentLesson: (lessonId: string) => void;
  toggleSidebar: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setVideoProgress: (progress: number) => void;
}

export const useCoursePlayerStore = create<CoursePlayerState>((set) => ({
  currentLessonId: null,
  isSidebarOpen: true,
  playbackSpeed: 1,
  videoProgress: 0,
  setCurrentLesson: (lessonId) => set({ currentLessonId: lessonId }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setVideoProgress: (progress) => set({ videoProgress: progress }),
}));
