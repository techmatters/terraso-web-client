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

import { useRef } from 'react';
import { Box } from '@mui/material';

import AppBar from 'terraso-web-client/layout/AppBar';
import Footer from 'terraso-web-client/layout/Footer';
import Navigation from 'terraso-web-client/navigation/components/Navigation';
import Routes, {
  usePathParams,
} from 'terraso-web-client/navigation/components/Routes';

import 'terraso-web-client/index.css';

import BreadcrumbsShareContainer from 'terraso-web-client/layout/BreadcrumbsShareContainer';
import OptionalAuthBottomMessage from 'terraso-web-client/account/components/OptionalAuthBottomMessage';
import OptionalAuthTopMessage from 'terraso-web-client/account/components/OptionalAuthTopMessage';

const App = () => {
  const contentRef = useRef();
  const navigationRef = useRef();
  const { isEmbedded, optionalAuth } = usePathParams();

  if (isEmbedded || optionalAuth.isEmbedded) {
    return <Routes />;
  }

  return (
    <>
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
            position: 'relative',
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
