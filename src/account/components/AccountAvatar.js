import React from 'react';
import _ from 'lodash/fp';
import { Avatar } from '@mui/material';

const AccountAvatar = props => {
  const { user } = props;
  const name = `${user.firstName} ${user.lastName}`;
  return (
    <Avatar
      aria-label={name}
      alt={name}
      src={user.profileImage}
      {..._.omit('user', props)}
    >
      {user.firstName.substr(0, 1).toUpperCase()}
    </Avatar>
  );
};

export default AccountAvatar;
