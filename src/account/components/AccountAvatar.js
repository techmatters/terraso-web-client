import React from 'react';
import _ from 'lodash/fp';
import { Avatar, Typography } from '@mui/material';

const AccountAvatar = props => {
  const { user } = props;
  const name = `${user.firstName} ${user.lastName}`;

  return (
    <Avatar
      role="img"
      aria-label={name}
      alt={name}
      src={user.profileImage}
      imgProps={{
        alt: '',
      }}
      {..._.omit('user', props)}
    >
      <Typography aria-hidden="true" {..._.pick('sx.fontSize', props)}>
        {user.firstName.substr(0, 1).toUpperCase()}
      </Typography>
    </Avatar>
  );
};

export default AccountAvatar;
