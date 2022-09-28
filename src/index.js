import React, { useRef } from 'react';

import { createRoot } from 'react-dom/client';

import { Box } from '@mui/material';

import AppBar from 'common/components/AppBar';
import AppWrappers from 'layout/AppWrappers';
import Footer from 'layout/Footer';
import reportWebVitals from 'monitoring/reportWebVitals';
import Navigation from 'navigation/Navigation';
import Routes from 'navigation/Routes';
import rules from 'permissions/rules';
import createStore from 'state/store';

import theme from 'theme';

import 'index.css';

import Breadcrumbs from 'navigation/Breadcrumbs';

const App = () => {
  const contentRef = useRef();
  const navigationRef = useRef();

  return (
    <>
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
          <Breadcrumbs />
          <Routes />
        </Box>
        <Footer />
      </Box>
    </>
  );
};

createRoot(document.getElementById('root')).render(
  <AppWrappers store={createStore()} theme={theme} permissionsRules={rules}>
    <App />
  </AppWrappers>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
