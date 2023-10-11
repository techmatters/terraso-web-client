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
import React from 'react';
import _ from 'lodash/fp';
import { useCollaborationContext } from 'collaboration/collaborationContext';
import { MEMBERSHIP_STATUS_PENDING, MEMBERSHIP_TYPE_CLOSED } from 'collaboration/collaborationConstants';

const MembershipJoinLeaveButton = props => {
  const {
    owner,
    membershipsInfo,
    accountMembership,
    MemberLeaveButton,
    onMemberRemove,
    MemberJoinButton,
    onMemberJoin,
    MemberRequestJoinButton,
    MemberRequestCancelButton,
  } = useCollaborationContext();
  const { tabIndex } = props;

  if (
    accountMembership &&
    accountMembership.membershipStatus === MEMBERSHIP_STATUS_PENDING
  ) {
    return (
      <MemberRequestCancelButton
        onConfirm={onMemberRemove}
        owner={owner}
        buttonProps={{ tabIndex }}
      />
    );
  }
  if (accountMembership) {
    return (
      <MemberLeaveButton
        onConfirm={onMemberRemove}
        owner={owner}
        buttonProps={{ tabIndex }}
      />
    );
  }
  if (membershipsInfo?.membershipType === MEMBERSHIP_TYPE_CLOSED) {
    return (
      <MemberRequestJoinButton
        onJoin={onMemberJoin}
        // loading={loading}
        buttonProps={{ tabIndex }}
      />
    );
  }
  return (
    <MemberJoinButton
      onJoin={onMemberJoin}
      // loading={loading}
      buttonProps={{ tabIndex }}
    />
  );
};

export default MembershipJoinLeaveButton;
