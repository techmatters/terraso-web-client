/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import React, { useMemo } from 'react';

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

  const loading = useMemo(() => fetching || joining, [fetching, joining]);

  const userMembership = _.get('membersInfo.accountMembership', group);

  const onJoin = successMessage => () => {
    trackEvent('joinGroup', { props: { group: groupSlug } });
    dispatch(
      joinGroup({
        groupSlug,
        userEmail,
        ownerName: owner.name,
        successMessage,
      })
    ).then(() => updateOwner?.());
  };

  const onRemove = successMessage => () => {
    trackEvent('leaveGroup', { props: { group: groupSlug } });
    dispatch(
      leaveGroup({
        groupSlug,
        membershipId: userMembership.id,
        ownerName: owner.name,
        successMessage,
      })
    ).then(() => updateOwner?.());
  };

  if (
    userMembership &&
    userMembership.membershipStatus === MEMBERSHIP_STATUS_PENDING
  ) {
    return (
      <MemberRequestCancelButton
        onConfirm={onRemove('group.request_cancel_success')}
        owner={owner}
      />
    );
  }
  if (userMembership) {
    return (
      <MemberLeaveButton
        onConfirm={onRemove('group.leave_success')}
        owner={owner}
      />
    );
  }
  if (group?.membershipType === MEMBERSHIP_CLOSED) {
    return (
      <MemberRequestJoinButton
        onJoin={onJoin('group.request_success')}
        loading={loading}
      />
    );
  }
  return (
    <MemberJoinButton onJoin={onJoin('group.join_success')} loading={loading} />
  );
};

export default GroupMembershipJoinLeaveButton;
