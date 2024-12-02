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

import React from 'react';
import _ from 'lodash/fp';
import { Trans, withTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { Box, Typography } from '@mui/material';

import RouterLink from 'common/components/RouterLink';
import { useOptionalAuth } from 'navigation/components/Routes';
import { generateReferrerUrl } from 'navigation/navigationUtils';

const OptionalAuthBottomMessage = () => {
  const location = useLocation();
  const { bottomMessage } = useOptionalAuth();
  const hasToken = useSelector(_.get('account.hasToken'));

  if (!bottomMessage || hasToken) {
    return null;
  }

  return (
    <Box
      id="optional-auth-bottom-message-container"
      sx={{ bgcolor: 'white', p: 2, display: 'flex', justifyContent: 'center' }}
    >
      <Typography
        sx={{
          bgcolor: 'blue.lite',
          color: 'black',
          textAlign: 'center',
          p: 1,
          pl: 5,
          pr: 5,
        }}
      >
        <Trans i18nKey={bottomMessage}>
          prefix
          <RouterLink
            to={generateReferrerUrl('/account', location)}
            sx={{ textDecoration: 'underline' }}
          >
            link
          </RouterLink>
          suffix
        </Trans>
      </Typography>
    </Box>
  );
};

export default withTranslation()(OptionalAuthBottomMessage);
