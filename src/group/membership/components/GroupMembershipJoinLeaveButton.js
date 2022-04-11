import React from 'react';
import _ from 'lodash/fp';
import { useSelector, useDispatch } from 'react-redux';

import { joinGroup, leaveGroup } from 'group/groupSlice';
import { useGroupContext } from 'group/groupContext';
import { useAnalytics } from 'monitoring/anaylitics';

const GroupMembershipJoinLeaveButton = () => {
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const { owner, groupSlug, MemberLeaveButton, MemberJoinButton } =
    useGroupContext();
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
    );
  };

  const onLeave = () => {
    trackEvent('leaveGroup', { props: { group: groupSlug } });
    dispatch(
      leaveGroup({
        groupSlug,
        membershipId: userMembership.id,
        ownerName: owner.name,
      })
    );
  };

  if (userMembership) {
    return <MemberLeaveButton onConfirm={onLeave} owner={owner} />;
  }
  return <MemberJoinButton onJoin={onJoin} loading={loading} />;
};

export default GroupMembershipJoinLeaveButton;
