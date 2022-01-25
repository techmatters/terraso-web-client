import React from 'react';
import _ from 'lodash/fp';
import { useSelector } from 'react-redux';
import { Typography } from '@mui/material';

const GroupMembershipCount = ({ groupSlug }) => {
  const { group } = useSelector(_.getOr({}, `group.memberships.${groupSlug}`));
  const members = _.getOr([], 'members', group);
  return <Typography variant="body1">{members.length}</Typography>;
};

export default GroupMembershipCount;
