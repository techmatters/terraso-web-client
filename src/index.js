/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */
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
        <Box class="header-container">
          <AppBar />
          <Navigation ref={navigationRef} />
        </Box>
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
