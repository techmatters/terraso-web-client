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
import _ from 'lodash/fp.js';
import { Trans, withTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Typography } from '@mui/material';

import RouterLink from 'common/components/RouterLink.js';
import { useOptionalAuth } from 'navigation/components/Routes.js';

const OptionalAuthTopMessage = () => {
  const { topMessage } = useOptionalAuth();
  const hasToken = useSelector(_.get('account.hasToken'));

  if (!topMessage || hasToken) {
    return null;
  }

  return (
    <Typography
      id="optional-auth-top-message-container"
      sx={{
        bgcolor: 'blue.dark1',
        color: 'white',
        textAlign: 'center',
        p: 1,
      }}
    >
      <Trans i18nKey={topMessage}>
        prefix
        <RouterLink
          to="/account"
          sx={{ color: 'white', textDecoration: 'underline' }}
        >
          link
        </RouterLink>
        suffix
      </Trans>
    </Typography>
  );
};

export default withTranslation()(OptionalAuthTopMessage);
