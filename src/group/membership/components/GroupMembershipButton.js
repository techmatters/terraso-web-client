import React from 'react';
import _ from 'lodash/fp';
import { useSelector, useDispatch } from 'react-redux';

import { joinGroup, leaveGroup } from 'group/groupSlice';
import { useGroupContext } from 'group/groupContext';

const GroupMembershipButton = props => {
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

  // TODO This should just be 5 users and we should get the total count from
  // the backend when the support is added
  const members = _.getOr([], 'members', group);

  // TODO This should come from the backend when we have the authenticated user
  const userMembership = members.find(member => member.email === userEmail);

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
        membershipId: userMembership.membershipId,
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
