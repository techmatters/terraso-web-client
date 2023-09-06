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
import { useTranslation } from 'react-i18next';
import { Stack, Typography } from '@mui/material';

import AccountAvatar from 'account/components/AccountAvatar';

const MemberName = ({ member }) => {
  const { t } = useTranslation();
  return (
    <Stack
      direction="row"
      justifyContent="flex-start"
      alignItems="center"
      spacing={2}
    >
      {!member.pendingEmail && (
        <AccountAvatar
          component="div"
          sx={{ width: 34, height: 34 }}
          user={member}
        />
      )}
      <Typography>{t('user.full_name', { user: member })}</Typography>
    </Stack>
  );
};

export default MemberName;
