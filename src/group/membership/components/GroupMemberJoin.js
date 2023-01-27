﻿/*
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

import { LoadingButton } from '@mui/lab';

import { useGroupContext } from 'group/groupContext';

const GroupMemberJoin = props => {
  const { t } = useTranslation();

  const { owner } = useGroupContext();

  return (
    <LoadingButton
      variant="outlined"
      aria-label={t(props.ariaLabel, {
        name: _.get('name', owner),
      })}
      onClick={props.onJoin}
      loading={props.loading}
      sx={{ flexGrow: 1 }}
    >
      {t(props.label)}
    </LoadingButton>
  );
};

export default GroupMemberJoin;
