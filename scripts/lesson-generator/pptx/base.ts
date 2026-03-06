import PptxGenJS from 'pptxgenjs';
import type { ThemeId } from '../types';
import { SLIDE, getColors } from './theme';

export function createPresentation(courseTitle: string, themeId: ThemeId): PptxGenJS {
  const colors = getColors(themeId);
  const pres = new PptxGenJS();

  pres.layout = 'LAYOUT_16x9';
  pres.author = 'Virginia Institute of Finance and Management';
  pres.title = courseTitle;

  // Define slide masters
  pres.defineSlideMaster({
    title: 'VIFM_CONTENT',
    background: { color: colors.bg },
  });

  pres.defineSlideMaster({
    title: 'VIFM_TITLE',
    background: { color: colors.bg },
  });

  return pres;
}
