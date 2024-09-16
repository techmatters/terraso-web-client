/*
 * Copyright © 2023 Technology Matters
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
import { Box } from '@mui/material';

import AppBar from 'layout/AppBar';
import Footer from 'layout/Footer';
import Navigation from 'navigation/components/Navigation';
import Routes, { useOptionalAuth } from 'navigation/components/Routes';

import 'index.css';

import WebSocket from 'webSockets/WebSocket';

import BreadcrumbsShareContainer from 'layout/BreadcrumbsShareContainer';
import OptionalAuthBottomMessage from 'account/components/OptionalAuthBottomMessage';
import OptionalAuthTopMessage from 'account/components/OptionalAuthTopMessage';

const App = () => {
  const contentRef = useRef();
  const navigationRef = useRef();
  const { isEmbedded } = useOptionalAuth();

  if (isEmbedded) {
    return <Routes />;
  }

  return (
    <>
      <WebSocket />
      <Box
        sx={{
          bgcolor: 'white',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Box id="header-container">
          <AppBar />
          <Navigation ref={navigationRef} />
        </Box>
        <Box
          component="main"
          id="content"
          tabIndex="-1"
          ref={contentRef}
          sx={{
            bgcolor: 'primary.background',
            flex: 1,
          }}
        >
          <OptionalAuthTopMessage />
          <BreadcrumbsShareContainer />
          <Routes />
          <OptionalAuthBottomMessage />
        </Box>
        <Footer />
      </Box>
    </>
  );
};

export default App;
