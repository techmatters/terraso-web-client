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

import { Fragment } from 'react';
import { Trans } from 'react-i18next';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import { Link, Stack, Typography } from '@mui/material';

import { withProps } from 'terraso-web-client/react-hoc';

const MembershipPendingWarning = props => {
  const { count, onPendingClick, link = false, sx } = props;

  const onClick = event => {
    onPendingClick();
    event.stopPropagation();
    event.preventDefault();
  };

  const CountComponent = link
    ? withProps(Link, { href: '#', onClick })
    : Fragment;

  return (
    <Stack direction="row" spacing={1} sx={sx}>
      <NotificationImportantIcon sx={{ color: 'gray.mid2' }} />
      <Trans i18nKey="group.members_pending_message" count={count}>
        <Typography>
          <CountComponent>link</CountComponent>
          text
        </Typography>
      </Trans>
    </Stack>
  );
};

export default MembershipPendingWarning;
