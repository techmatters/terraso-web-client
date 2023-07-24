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
import {
  joinMembershipList,
  leaveMembershipList,
} from 'terraso-client-shared/memberships/membershipsSlice';
import { useDispatch, useSelector } from 'terrasoApi/store';

import { useAnalytics } from 'monitoring/analytics';
import { useGroupContext } from 'group/groupContext';

import {
  MEMBERSHIP_CLOSED,
  MEMBERSHIP_STATUS_PENDING,
} from './groupMembershipConstants';

const GroupMembershipJoinLeaveButton = props => {
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
  const { fetching, group, joining } =
    useSelector(state => state.memberships.lists[groupSlug]) || {};
  const { tabIndex } = props;

  const loading = useMemo(() => fetching || joining, [fetching, joining]);

  const userMembership = _.get('membersInfo.accountMembership', group);

  const onJoin = successMessage => () => {
    trackEvent('group.join', { props: { group: groupSlug } });
    dispatch(
      joinMembershipList({
        groupSlug,
        userEmail,
        ownerName: owner.name,
        successMessage,
      })
    ).then(() => updateOwner?.());
  };

  const onRemove = successMessage => () => {
    trackEvent('group.leave', { props: { group: groupSlug } });
    dispatch(
      leaveMembershipList({
        groupSlug,
        membershipId: userMembership.membershipId,
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
        buttonProps={{ tabIndex }}
      />
    );
  }
  if (userMembership) {
    return (
      <MemberLeaveButton
        onConfirm={onRemove('group.leave_success')}
        owner={owner}
        buttonProps={{ tabIndex }}
      />
    );
  }
  if (group?.membershipType === MEMBERSHIP_CLOSED) {
    return (
      <MemberRequestJoinButton
        onJoin={onJoin('group.request_success')}
        loading={loading}
        buttonProps={{ tabIndex }}
      />
    );
  }
  return (
    <MemberJoinButton
      onJoin={onJoin('group.join_success')}
      loading={loading}
      buttonProps={{ tabIndex }}
    />
  );
};

export default GroupMembershipJoinLeaveButton;
