import React from 'react';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import { Typography } from '@mui/material';

const GroupMembershipCount = ({ groupSlug }) => {
  const { group } = useSelector(state =>
    _.get(state, `group.memberships.${groupSlug}`, {})
  );
  const members = _.get(group, 'members', []);
  return <Typography variant="body1">{members.length}</Typography>;
};

export default GroupMembershipCount;
