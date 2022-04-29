import React from 'react';
import { useSelector } from 'react-redux';

import { Typography } from '@mui/material';

import _ from 'lodash/fp';

const GroupMembershipCount = ({ groupSlug }) => {
  const { group } = useSelector(_.getOr({}, `group.memberships.${groupSlug}`));
  const count = _.getOr(0, 'membersInfo.totalCount', group);
  return <Typography variant="body1">{count}</Typography>;
};

export default GroupMembershipCount;
