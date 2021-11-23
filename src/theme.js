import { createTheme } from '@mui/material/styles'

const colorTheme = createTheme({
  palette: {
    tonalOffset: 0.2,
    primary: {
      main: '#307F9C'
    },
    secondary: {
      main: '#5E5547'
    },
    link: '#307F9C',
    success: {
      main: '#b0d098'
    },
    info: {
      main: '#76a7ec'
    },
    cardBorder: '#DADADA',
    white: '#FFFFFF',
    gray: {
      lite2: '#F5F5F5',
      lite1: '#DDDDDD',
      mid: '#C4C4C4',
      mid2: '#AAAAAA',
      dark1: '#666666',
      dark2: '#333333'
    },
    black: '#000000'
  }
})

const components = {
  MuiAppBar: {
    defaultProps: {
      sx: {
        bgcolor: colorTheme.palette.gray.lite2
      },
      elevation: 0
    }
  },
  MuiButton: {
    variants: [{
      props: {
        variant: 'outlined'
      },
      style: {
        borderColor: colorTheme.palette.black,
        color: colorTheme.palette.black
      }
    }]
  }
}

const theme = createTheme(colorTheme, {
  typography: {
    h1: {
      fontSize: '30px'
    },
    h5: {
      fontSize: '22px'
    }
  },
  components
})

export default theme
