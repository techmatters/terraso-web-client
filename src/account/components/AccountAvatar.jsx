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

import React from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { Avatar, Typography } from '@mui/material';

const AccountAvatar = props => {
  const { t } = useTranslation();
  const { user, showAlt, component } = props;

  const muiAvatarAllowedProps = [
    'alt',
    'children',
    'classes',
    'className',
    'component',
    'imgProps',
    'sizes',
    'src',
    'srcSet',
    'sx',
    'variant',
  ];

  if (!user) {
    return null;
  }

  return (
    <Avatar
      alt={t('user.full_name', { user })}
      src={user.profileImage}
      {...(!showAlt ? { imgProps: { alt: '' } } : {})}
      {..._.pick(muiAvatarAllowedProps, props)}
      component={component}
    >
      <Typography aria-hidden="true" {..._.pick('sx.fontSize', props)}>
        {user.firstName.substr(0, 1).toUpperCase()}
      </Typography>
    </Avatar>
  );
};

export default AccountAvatar;
