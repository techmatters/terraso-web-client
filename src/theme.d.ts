/*
 * Copyright © 2025 Technology Matters
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

import { Theme } from '@mui/material';

declare module '@mui/material/styles' {
  interface ButtonTone {
    main: string;
    hover: string;
    contrastText: string;
    subtle: string;
    disabled: string;
  }

  interface ButtonTokens {
    base: {
      gap: string;
      borderRadius: string;
      whiteSpace: string;
      fontFamily: string;
      fontSize: string;
      fontStyle: string;
      fontWeight: number;
      lineHeight: string;
    };
    buttonFocusOutline: {
      outline: string;
      outlineOffset: string;
      borderRadius: string;
    };
    sizes: {
      small: {
        padding: string;
        fontSize: string;
      };
      medium: {
        padding: string;
        fontSize: string;
      };
      large: {
        padding: string;
        fontSize: string;
      };
    };
    containedHoverShadow: string;
    tones: {
      primary: ButtonTone;
      secondary: ButtonTone;
    };
  }

  interface RichTextPalette {
    link: string;
    highlightBackground: string;
    highlightText: string;
  }

  interface PageContentBand {
    background: string;
  }

  interface Palette {
    visualization: {
      markerDefaultColor: string;
    };
    richText: RichTextPalette;
  }

  interface PaletteOptions {
    richText?: Partial<RichTextPalette>;
  }

  interface Theme {
    backgroundNavColor: string;
    buttonTokens: ButtonTokens;
    pageContentBand: PageContentBand;
  }

  interface ThemeOptions {
    backgroundNavColor?: string;
    buttonTokens?: ButtonTokens;
    pageContentBand?: Partial<PageContentBand>;
  }
}

export const theme: Theme;

export default theme;
