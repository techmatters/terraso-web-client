import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { Box } from '@mui/material';

import reportWebVitals from 'monitoring/reportWebVitals';
import createStore from 'state/store';
import rules from 'permissions/rules';
import theme from 'theme';
import AppBar from 'common/components/AppBar';
import AppWrappers from 'common/components/AppWrappers';
import Routes from 'navigation/Routes';
import Navigation from 'navigation/Navigation';
import Footer from 'common/components/Footer';
import SkipLinks from 'navigation/SkipLinks';

import 'index.css';

const App = () => {
  const contentRef = useRef();
  const navigationRef = useRef();

  return (
    <>
      <SkipLinks contentRef={contentRef} navigationRef={navigationRef} />
      <Box sx={{ flexGrow: 1, bgcolor: 'gray.lite2' }}>
        <AppBar />
        <Navigation ref={navigationRef} />
        <Box
          component="main"
          id="content"
          tabIndex="-1"
          ref={contentRef}
          sx={{
            bgcolor: 'white',
            marginBottom: { xs: '29vh', sm: '15vh', md: '10vh' },
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
