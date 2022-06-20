import React from 'react';

import _ from 'lodash/fp';
import { useDispatch, useSelector } from 'react-redux';

import { useAnalytics } from 'monitoring/analytics';

import { useGroupContext } from 'group/groupContext';
import { joinGroup, leaveGroup } from 'group/groupSlice';

import {
  MEMBERSHIP_CLOSED,
  MEMBERSHIP_STATUS_PENDING,
} from './groupMembershipConstants';

const GroupMembershipJoinLeaveButton = () => {
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const {
    owner,
    groupSlug,
    MemberLeaveButton,
    MemberJoinButton,
    MemberRequestJoinButton,
    MemberRequestCancelButton,
    updateOwner,
  } = useGroupContext();
  const {
    data: { email: userEmail },
  } = useSelector(state => state.account.currentUser);
  const { fetching, group, joining } = useSelector(
    _.getOr({}, `group.memberships.${groupSlug}`)
  );

  const loading = fetching || joining;

  const userMembership = _.get('membersInfo.accountMembership', group);

  const onJoin = () => {
    trackEvent('joinGroup', { props: { group: groupSlug } });
    dispatch(
      joinGroup({
        groupSlug,
        userEmail,
        ownerName: owner.name,
      })
    ).then(() => updateOwner?.());
  };

  const onLeave = () => {
    trackEvent('leaveGroup', { props: { group: groupSlug } });
    dispatch(
      leaveGroup({
        groupSlug,
        membershipId: userMembership.id,
        ownerName: owner.name,
      })
    ).then(() => updateOwner?.());
  };

  if (
    userMembership &&
    userMembership.membershipStatus === MEMBERSHIP_STATUS_PENDING
  ) {
    return <MemberRequestCancelButton onConfirm={onLeave} owner={owner} />;
  }
  if (userMembership) {
    return <MemberLeaveButton onConfirm={onLeave} owner={owner} />;
  }
  if (group?.membershipType === MEMBERSHIP_CLOSED) {
    return <MemberRequestJoinButton onJoin={onJoin} loading={loading} />;
  }
  return <MemberJoinButton onJoin={onJoin} loading={loading} />;
};

export default GroupMembershipJoinLeaveButton;
