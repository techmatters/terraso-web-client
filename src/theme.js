import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  typography: {
    h1: {
      fontSize: '30px',
      fontWeight: 'bold'
    },
    h5: {
      fontSize: '22px'
    }
  },
  palette: {
    type: 'light',
    text: {
      primary: '#5E5547',
    },
    primary: {
      main: '#307F9C',
    },
    secondary: {
      main: '#5E5547'
    }
  }
})

export default theme
