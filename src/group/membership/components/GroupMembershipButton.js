import React from 'react';
import _ from 'lodash/fp';
import { useSelector, useDispatch } from 'react-redux';

import { joinGroup, leaveGroup } from 'group/groupSlice';
import { useGroupContext } from 'group/groupContext';

const GroupMembershipButton = () => {
  const dispatch = useDispatch();
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
    dispatch(
      joinGroup({
        groupSlug,
        userEmail,
        ownerName: owner.name,
      })
    );
  };

  const onLeave = () => {
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

export default GroupMembershipButton;
