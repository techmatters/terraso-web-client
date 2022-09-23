import React from 'react';

import _ from 'lodash/fp';

import { Avatar, Typography } from '@mui/material';

const AccountAvatar = props => {
  const { user, showAlt, component } = props;
  const name = `${user.firstName} ${user.lastName}`;

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

  return (
    <Avatar
      alt={name}
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
