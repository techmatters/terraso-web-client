import { createTheme } from '@mui/material/styles';

const colorTheme = createTheme({
  palette: {
    tonalOffset: 0.2,
    primary: {
      main: '#307F9C',
    },
    secondary: {
      main: '#5E5547',
    },
    link: '#307F9C',
    success: {
      main: '#b0d098',
    },
    info: {
      main: '#76a7ec',
    },
    cardBorder: '#DADADA',
    white: '#FFFFFF',
    gray: {
      lite2: '#F5F5F5',
      lite1: '#DDDDDD',
      mid: '#C4C4C4',
      mid2: '#AAAAAA',
      dark1: '#666666',
      dark2: '#333333',
    },
    black: '#000000',
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
  MuiButton: {
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
    defaultProps: {
      sx: {
        '& .Mui-disabled': {
          bgcolor: colorTheme.palette.gray.lite1,
        },
      },
    },
  },
  MuiLink: {
    defaultProps: {
      underline: 'none',
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        color: colorTheme.palette.gray.dark2,
      },
    },
  },
};

const theme = createTheme(colorTheme, {
  typography: {
    h1: {
      fontSize: '2rem',
    },
    h2: {
      fontSize: '1.2rem',
      fontWeight: 400,
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
