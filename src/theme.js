import { createTheme } from '@mui/material/styles';

const colorTheme = createTheme({
  palette: {
    tonalOffset: 0.2,
    primary: {
      main: '#2C7690',
    },
    secondary: {
      main: '#5E5547',
    },
    link: '#2C7690',
    success: {
      main: '#b0d098',
    },
    info: {
      main: '#76a7ec',
    },
    cardBorder: '#DADADA',
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
      mid: '#D2EDF7',
      dark: '#2C7690',
    },
    black: '#000000',
    map: {
      polygon: '#0055CC',
    },
  },
});

const components = {
  MuiAppBar: {
    defaultProps: {
      sx: {
        bgcolor: colorTheme.palette.gray.lite2,
        color: 'gray.dark1',
      },
      elevation: 0,
    },
  },
  MuiButtonBase: {
    defaultProps: {
      disableRipple: true,
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        '&:focus': {
          outline: `2px solid ${colorTheme.palette.blue.dark}`,
          outlineOffset: '3px',
        },
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
          borderColor: colorTheme.palette.black,
          color: colorTheme.palette.black,
        },
      },
    ],
  },
  MuiCard: {
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
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: colorTheme.palette.gray.mid,
        },
        '& .Mui-disabled': {
          bgcolor: colorTheme.palette.gray.lite1,
        },
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
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
};

const theme = createTheme(colorTheme, {
  typography: {
    h1: {
      fontSize: '2rem',
      fontWeight: 400,
    },
    h2: {
      fontSize: '1.2rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      paddingTop: '1rem',
    },
    h3: {
      fontSize: '1rem',
      fontWeight: 300,
      paddingTop: '1rem',
    },
    h5: {
      fontSize: '22px',
    },
    button: {
      textTransform: 'none',
      fontWeight: 0,
    },
  },
  components,
});

export default theme;
