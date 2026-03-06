import type { ThemeId } from '../types';

export interface ThemeVars {
  bg: string;
  dark: string;
  green: string;
  mid: string;
  light: string;
  blue: string;
  blue2: string;
  white: string;
  gray: string;
  card: string;
}

export const THEMES: Record<ThemeId, ThemeVars> = {
  finance: {
    bg: '#060e0d', dark: '#0d1f1d', green: '#1d4340', mid: '#2a5f5a',
    light: '#3a8078', blue: '#4a9e96', blue2: '#72c4bc',
    white: '#F5F0E8', gray: '#8A9E9B', card: 'rgba(13,31,29,0.68)',
  },
  banking: {
    bg: '#060d0a', dark: '#0b1912', green: '#153124', mid: '#1f4a35',
    light: '#2d6b4d', blue: '#3d9e6a', blue2: '#62c48e',
    white: '#F5F0E8', gray: '#8A9E92', card: 'rgba(11,25,18,0.68)',
  },
  data: {
    bg: '#060a10', dark: '#0a1525', green: '#0f2440', mid: '#1a3a6a',
    light: '#2a5a9a', blue: '#5391d5', blue2: '#7AB0E8',
    white: '#F5F0E8', gray: '#8A9BB5', card: 'rgba(10,21,37,0.68)',
  },
  strategy: {
    bg: '#07070e', dark: '#0e0e22', green: '#121140', mid: '#1e1d60',
    light: '#2e2c88', blue: '#5c5ab8', blue2: '#8a88d8',
    white: '#F5F0E8', gray: '#9090b8', card: 'rgba(14,14,34,0.68)',
  },
  realestate: {
    bg: '#060e0d', dark: '#0d1f1d', green: '#1d4340', mid: '#2a5f5a',
    light: '#3a8078', blue: '#4a9e96', blue2: '#72c4bc',
    white: '#F5F0E8', gray: '#8A9E9B', card: 'rgba(13,31,29,0.68)',
  },
  certified: {
    bg: '#0a0614', dark: '#140825', green: '#30025e', mid: '#480490',
    light: '#6206ba', blue: '#8930d8', blue2: '#b070f0',
    white: '#F5F0E8', gray: '#9a88b0', card: 'rgba(20,8,37,0.68)',
  },
};

export function getThemeCSS(theme: ThemeId): string {
  const t = THEMES[theme];
  return `
    --bg:${t.bg};--dark:${t.dark};--green:${t.green};--mid:${t.mid};
    --light:${t.light};--blue:${t.blue};--blue2:${t.blue2};
    --white:${t.white};--gray:${t.gray};--card:${t.card};
  `;
}
