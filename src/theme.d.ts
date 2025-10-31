import { Theme } from '@mui/material';

declare module '@mui/material/styles' {
  interface Palette {
    visualization: {
      markerDefaultColor: string;
    };
  }
}

export const theme: Theme;

export default theme;
