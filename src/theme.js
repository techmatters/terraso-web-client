/*
 * Copyright © 2021-2023 Technology Matters
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

import ErrorIcon from '@mui/icons-material/Report';
import { createTheme } from '@mui/material/styles';

const defaultFontStack = 'Roboto, Helvetica, Arial, sans-serif';
const headerFontStack = 'Lato, Helvetica, Arial, sans-serif';

const colorTheme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      xm: 1300,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    tonalOffset: 0.2,
    primary: {
      main: '#028843',
      hover: '#006130',
      background: '#F9FCF8',
    },
    secondary: {
      main: '#00344D',
    },
    link: '#076B8E',
    success: {
      main: '#b0d098',
      background: '#E2F5D9',
    },
    info: {
      main: '#76a7ec',
    },
    error: {
      main: '#d32f2f',
      background: '#fdeded',
    },
    cardBorder: '#E5E5E5',
    white: '#FFFFFF',
    gray: {
      lite2: '#f9f9f9',
      lite1: '#DDDDDD',
      mid: '#949494',
      mid2: '#AAAAAA',
      dark1: '#666666',
      dark2: '#333333',
    },
    blue: {
      lite: '#F3FAFD',
      lite2: '#F5F7FC',
      mid: '#D2EDF7',
      dark: '#2C7690',
      dark1: '#125A7E',
      dark2: '#076B8E',
      dark3: '#00344D',
      background: '#F7FAFB', // rgba(44, 118, 144, 0.04) converted to hex for use on nonwhite background where alpha can't be used
    },
    black: '#000000',
    map: {
      polygon: '#0055CC',
      polygonFill: '#D6E7FF',
      marker: '#FF580D',
      markerControl: '#00344D',
    },
    visualization: {
      markerDefaultColor: '#FF580D',
    },
    richText: {
      link: '#71B8D2',
    },
  },
});

export const focusOutline = {
  outline: `2px solid ${colorTheme.palette.blue.dark}`,
  outlineOffset: '3px',
  borderRadius: '2px',
};

const components = {
  MuiAppBar: {
    defaultProps: {
      sx: {
        bgcolor: colorTheme.palette.white,
        color: 'gray.dark1',
      },
      elevation: 0,
    },
  },
  MuiButtonBase: {
    defaultProps: {
      disableRipple: true,
    },
    styleOverrides: {
      root: {
        '&:focus': focusOutline,
        fontWeight: 'bold',
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: '2px',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        color: colorTheme.palette.link,
      },
    },
    defaultProps: {
      disableElevation: true,
    },
    variants: [
      {
        props: {
          variant: 'outlined',
        },
        style: {
          backgroundColor: colorTheme.palette.white,
          borderColor: colorTheme.palette.secondary.main,
          color: colorTheme.palette.secondary.main,
          '&:hover': {
            backgroundColor: colorTheme.palette.secondary.main,
            borderColor: colorTheme.palette.secondary.main,
            color: colorTheme.palette.white,
          },
        },
      },
      {
        props: {
          variant: 'contained',
        },
        style: {
          color: 'white',
          bavkgroundColor: colorTheme.palette.white,
        },
      },
    ],
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
      },
    },
    defaultProps: {
      variant: 'outlined',
    },
  },
  MuiInputLabel: {
    defaultProps: {
      shrink: true,
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        '& .MuiInputBase-input': {
          backgroundColor: colorTheme.palette.white,
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: colorTheme.palette.gray.mid,
        },
        '& .Mui-disabled': {
          bgcolor: colorTheme.palette.gray.lite1,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: colorTheme.palette.blue.dark,
        },
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        color: colorTheme.palette.link,
        ':focus': {
          textDecoration: 'underline ! important',
        },
      },
    },
    defaultProps: {
      underline: 'hover',
    },
  },
  MuiCardActions: {
    styleOverrides: {
      root: {
        padding: 16,
        display: 'inherit',
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        backgroundColor: colorTheme.palette.gray.lite1,
        color: colorTheme.palette.gray.dark2,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        fontSize: '1.125rem',
        '&.Mui-selected': {
          fontWeight: 700,
        },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      standardSuccess: {
        backgroundColor: colorTheme.palette.success.background,
      },
      standardError: {
        backgroundColor: colorTheme.palette.error.background,
      },
    },
    defaultProps: {
      iconMapping: {
        error: <ErrorIcon fontSize="inherit" />,
      },
    },
  },
  MuiDataGrid: {
    styleOverrides: {
      root: {
        '& .MuiDataGrid-row:nth-of-type(odd)': {
          backgroundColor: 'white',
          '&:hover': {
            background: 'white',
          },
        },
      },
    },
  },
  MuiCheckbox: {
    styleOverrides: {
      root: {
        '&.Mui-focusVisible': focusOutline,
      },
    },
  },
  MuiRadio: {
    styleOverrides: {
      root: {
        '&.Mui-focusVisible': focusOutline,
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: {
        fontFamily: defaultFontStack,
      },
    },
  },
};

const theme = createTheme(colorTheme, {
  // This color cannot be part of the regular palette above, as MUI fails to reconize it.
  // See https://github.com/mui/material-ui/issues/19711
  backgroundNavColor: '#00914712',
  typography: {
    fontFamily: defaultFontStack,
    h1: {
      fontFamily: headerFontStack,
      fontSize: '2rem',
      fontWeight: 700,
    },
    h2: {
      fontFamily: headerFontStack,
      fontSize: '1.2rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      paddingTop: '1rem',
    },
    h3: {
      fontSize: '1rem',
      fontWeight: 600,
      paddingTop: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 0,
    },
  },
  components,
});

export default theme;
