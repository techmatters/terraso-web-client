/*
 * Copyright © 2023 Technology Matters
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
import React, { useCallback, useMemo } from 'react';

import {
  MEMBERSHIP_STATUS_PENDING,
  MEMBERSHIP_TYPE_CLOSED,
} from 'collaboration/collaborationConstants';
import { useCollaborationContext } from 'collaboration/collaborationContext';

const MembershipJoinLeaveButton = props => {
  const {
    owner,
    membershipInfo,
    accountMembership,
    MemberLeaveButton,
    onMemberRemove,
    MemberJoinButton,
    onMemberJoin,
    MemberRequestJoinButton,
    MemberRequestCancelButton,
  } = useCollaborationContext();
  const { tabIndex } = props;

  const onMemberRemoveWrapper = useCallback(() => {
    onMemberRemove(accountMembership);
  }, [onMemberRemove, accountMembership]);

  const onMemberJoinWrapper = useCallback(() => {
    onMemberJoin(owner);
  }, [onMemberJoin, owner]);

  const is_member = useMemo(
    () => accountMembership?.membershipId,
    [accountMembership]
  );

  // Component to cancel a pending membership request
  if (
    is_member &&
    accountMembership?.membershipStatus === MEMBERSHIP_STATUS_PENDING
  ) {
    return (
      <MemberRequestCancelButton
        onConfirm={onMemberRemoveWrapper}
        owner={owner}
        buttonProps={{ tabIndex }}
        loading={accountMembership?.fetching}
      />
    );
  }

  // Component to leave a membership if the user is a member
  if (is_member) {
    return (
      <MemberLeaveButton
        onConfirm={onMemberRemoveWrapper}
        owner={owner}
        buttonProps={{ tabIndex }}
        loading={accountMembership?.fetching}
      />
    );
  }

  // Component to request to join a membership if the user is not a member
  // and the membership_list is closed
  if (membershipInfo?.membershipType === MEMBERSHIP_TYPE_CLOSED) {
    return (
      <MemberRequestJoinButton
        onJoin={onMemberJoinWrapper}
        loading={accountMembership?.fetching}
        buttonProps={{ tabIndex }}
      />
    );
  }

  // Component to join a membership if the user is not a member and
  // the membership_list is open
  return (
    <MemberJoinButton
      onJoin={onMemberJoinWrapper}
      loading={accountMembership?.fetching}
      buttonProps={{ tabIndex }}
    />
  );
};

export default MembershipJoinLeaveButton;
