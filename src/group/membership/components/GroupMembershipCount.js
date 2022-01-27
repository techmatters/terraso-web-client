import React from 'react';
import _ from 'lodash/fp';
import { useSelector } from 'react-redux';
import { Typography } from '@mui/material';

const GroupMembershipCount = ({ groupSlug }) => {
  const { group } = useSelector(_.getOr({}, `group.memberships.${groupSlug}`));
  const count = _.getOr([], 'membersInfo.totalCount', group);
  return <Typography variant="body1">{count}</Typography>;
};

export default GroupMembershipCount;
