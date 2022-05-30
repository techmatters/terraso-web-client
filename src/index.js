import React, { useRef } from 'react';

import ReactDOM from 'react-dom';

import { Box } from '@mui/material';

import AppBar from 'common/components/AppBar';
import AppWrappers from 'layout/AppWrappers';
import Footer from 'layout/Footer';
import reportWebVitals from 'monitoring/reportWebVitals';
import Navigation from 'navigation/Navigation';
import Routes from 'navigation/Routes';
import SkipLinks from 'navigation/SkipLinks';
import rules from 'permissions/rules';
import createStore from 'state/store';

import theme from 'theme';

import 'index.css';

const App = () => {
  const contentRef = useRef();
  const navigationRef = useRef();

  return (
    <>
      <SkipLinks contentRef={contentRef} navigationRef={navigationRef} />
      <Box
        sx={{
          bgcolor: 'gray.lite2',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <AppBar />
        <Navigation ref={navigationRef} />
        <Box
          component="main"
          id="content"
          tabIndex="-1"
          ref={contentRef}
          sx={{
            bgcolor: 'white',
            flex: 1,
          }}
        >
          <Routes />
        </Box>
        <Footer />
      </Box>
    </>
  );
};

ReactDOM.render(
  <AppWrappers store={createStore()} theme={theme} permissionsRules={rules}>
    <App />
  </AppWrappers>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
