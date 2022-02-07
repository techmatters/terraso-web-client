import React from 'react';
import ReactDOM from 'react-dom';
import { Box, Container } from '@mui/material';

import reportWebVitals from 'monitoring/reportWebVitals';
import createStore from 'state/store';
import rules from 'permissions/rules';
import theme from 'theme';
import AppBar from 'common/components/AppBar';
import AppWrappers from 'common/components/AppWrappers';
import Routes from 'navigation/Routes';
import Navigation from 'navigation/Navigation';
import Footer from 'common/components/Footer';
import SkipLink from 'navigation/SkipLink';

import 'index.css';

ReactDOM.render(
  <AppWrappers store={createStore()} theme={theme} permissionsRules={rules}>
    <SkipLink />
    <Box sx={{ flexGrow: 1, bgcolor: 'gray.lite2' }}>
      <AppBar />
      <Navigation />
      <Box
        component="main"
        id="content"
        sx={{
          bgcolor: 'white',
          marginBottom: { xs: '29vh', sm: '15vh', md: '10vh' },
        }}
      >
        <Container>
          <Routes />
        </Container>
      </Box>
      <Footer />
    </Box>
  </AppWrappers>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
