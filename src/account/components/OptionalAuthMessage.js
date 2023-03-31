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
import React, { useMemo } from 'react';

import _ from 'lodash/fp';
import { Trans } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { Typography } from '@mui/material';

import RouterLink from 'common/components/RouterLink';
import { useOptionalAuth } from 'navigation/components/Routes';
import { getReferrer } from 'navigation/navigationUtils';

const OptionalAuthMessage = () => {
  const location = useLocation();
  const { message } = useOptionalAuth();
  const hasToken = useSelector(_.get('account.hasToken'));

  const to = useMemo(() => {
    const referrer = getReferrer(location);
    return `/account?referrer=${referrer}`;
  }, [location]);

  if (!message || hasToken) {
    return null;
  }

  return (
    <Typography
      id="optional-auth-message-container"
      sx={{
        bgcolor: 'blue.dark1',
        color: 'white',
        textAlign: 'center',
        p: 1,
      }}
    >
      <Trans i18nKey={message}>
        prefix
        <RouterLink
          to={to}
          sx={{ color: 'white', textDecoration: 'underline' }}
        >
          link
        </RouterLink>
        suffix
      </Trans>
    </Typography>
  );
};

export default OptionalAuthMessage;
