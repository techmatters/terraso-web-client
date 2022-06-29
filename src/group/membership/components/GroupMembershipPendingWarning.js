import React from 'react';

import { Trans } from 'react-i18next';

import WarningIcon from '@mui/icons-material/Warning';
import { Link, Stack, Typography } from '@mui/material';

import { withProps } from 'react-hoc';

const GroupMembershipPendingWarning = props => {
  const { count, onPendingClick, link = false, sx } = props;

  const onClick = event => {
    onPendingClick();
    event.stopPropagation();
    event.preventDefault();
  };

  const CountComponent = link
    ? withProps(Link, { href: '#', onClick })
    : React.Fragment;

  return (
    <Stack direction="row" spacing={1} sx={sx}>
      <WarningIcon sx={{ color: 'gray.mid2' }} />
      <Trans i18nKey="group.members_pending_message" count={count}>
        <Typography>
          <CountComponent>link</CountComponent>
          text
        </Typography>
      </Trans>
    </Stack>
  );
};

export default GroupMembershipPendingWarning;
