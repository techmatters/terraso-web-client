import React, { useRef } from 'react';

import ReactDOM from 'react-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

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

import { REACT_APP_BASE_URL } from 'config';

import theme from 'theme';

import 'index.css';

const helmetContext = {};

const App = () => {
  const contentRef = useRef();
  const navigationRef = useRef();
  const { t } = useTranslation();

  return (
    <>
      <HelmetProvider context={helmetContext}>
        <Helmet>
          <meta name="description" content={t('site.description')} />
          <meta property="og:title" content={document.title} />
          <meta property="og:description" content={t('site.description')} />
          <meta
            property="og:image"
            content={`${REACT_APP_BASE_URL}/favicon.png`}
          />
        </Helmet>
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
      </HelmetProvider>
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
