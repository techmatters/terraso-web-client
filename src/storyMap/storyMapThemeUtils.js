/*
 * Copyright © 2026 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

export const DEFAULT_STORY_MAP_THEME = 'theme-1';

export const STORY_MAP_THEME_OPTIONS = [
  {
    id: 'theme-1',
    label: 'Theme 1',
    background: '#00344D',
    text: '#FFFFFF',
    link: '#3FC5F4',
    highlight: '#FAD47D',
    colorsLabel:
      'Background dark blue. Text white. Hyperlink light blue. Highlight yellow.',
  },
  {
    id: 'theme-2',
    label: 'Theme 2',
    background: '#F0F6F8',
    text: '#00344D',
    link: '#076B8E',
    highlight: '#A8DEF1',
    colorsLabel:
      'Background pale blue. Text dark blue. Hyperlink medium blue. Highlight light blue.',
  },
  {
    id: 'theme-3',
    label: 'Theme 3',
    background: '#52270B',
    text: '#F4EDE0',
    link: '#FEB98C',
    highlight: '#7ED4C8',
    colorsLabel:
      'Background dark brown. Text cream. Hyperlink peach. Highlight greenish-blue.',
  },
  {
    id: 'theme-4',
    label: 'Theme 4',
    background: '#F4EDE0',
    text: '#2E1F0E',
    link: '#A34507',
    highlight: '#E8B87A',
    colorsLabel:
      'Background cream. Text dark brown. Hyperlink rust orange. Highlight tan.',
  },
  {
    id: 'theme-5',
    label: 'Theme 5',
    background: '#1A3A2A',
    text: '#E8F0EB',
    link: '#72C48A',
    highlight: '#FAD47D',
    colorsLabel:
      'Background dark green. Text pale green. Hyperlink medium green. Highlight yellow.',
  },
  {
    id: 'theme-6',
    label: 'Theme 6',
    background: '#F5F5F0',
    text: '#1A3A2A',
    link: '#2E7D45',
    highlight: '#F5D4C8',
    colorsLabel:
      'Background off-white. Text dark green. Hyperlink green. Highlight light pink.',
  },
  {
    id: 'theme-7',
    label: 'Theme 7',
    background: '#FFFFFF',
    text: '#212121',
    link: '#076B8E',
    highlight: '#FFE2A0',
    colorsLabel:
      'Background white. Text charcoal. Hyperlink medium blue. Highlight pale yellow.',
  },
  {
    id: 'theme-8',
    label: 'Theme 8',
    background: '#2B2B2B',
    text: '#FFFFFF',
    link: '#63D0F8',
    highlight: '#FFE2A0',
    colorsLabel:
      'Background dark gray. Text white. Hyperlink light blue. Highlight pale yellow.',
  },
];

export const getStoryMapThemeOption = themeId =>
  STORY_MAP_THEME_OPTIONS.find(option => option.id === themeId) ||
  STORY_MAP_THEME_OPTIONS[0];

export const resolveStoryMapThemeId = config =>
  config?.themeId || DEFAULT_STORY_MAP_THEME;

export const getResolvedStoryMapTheme = config =>
  getStoryMapThemeOption(resolveStoryMapThemeId(config));

export const getStoryMapThemeCssVariables = config => {
  const themeOption = getResolvedStoryMapTheme(config);

  return {
    '--story-theme-background': themeOption.background,
    '--story-theme-text': themeOption.text,
    '--story-theme-link': themeOption.link,
    '--story-theme-highlight': themeOption.highlight,
  };
};
