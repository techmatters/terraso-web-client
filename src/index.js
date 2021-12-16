import React from 'react';
import ReactDOM from 'react-dom';
import { Box, Container } from '@mui/material';

import createStore from 'state/store';
import theme from 'theme';
import AppBar from 'common/components/AppBar';
import reportWebVitals from 'monitoring/reportWebVitals';
import AppWrappers from 'common/components/AppWrappers';

import Routes from 'navigation/Routes';
import Navigation from 'navigation/Navigation';

import 'index.css';

ReactDOM.render(
  <AppWrappers store={createStore()} theme={theme}>
    <Box sx={{ flexGrow: 1, bgcolor: 'gray.lite2' }}>
      <AppBar />
      <Container>
        <Navigation />
      </Container>
      <Box sx={{ bgcolor: 'white' }}>
        <Container>
          <Routes />
        </Container>
      </Box>
    </Box>
  </AppWrappers>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
