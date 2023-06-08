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
import _ from 'lodash/fp';
import type {
  AccountMembershipFragment,
  GroupFieldsFragment,
  GroupMembersFragment,
  GroupMembersInfoFragment,
  GroupMembersPendingFragment,
} from 'terrasoApi/shared/graphqlSchema/graphql';
import type {
  Membership,
  MembershipList,
} from 'terrasoApi/shared/memberships/membershipsSlice';

type MembershipQuery = Partial<
  GroupFieldsFragment &
    GroupMembersInfoFragment &
    AccountMembershipFragment &
    GroupMembersPendingFragment
>;

export const extractMembersInfo = (group?: MembershipQuery | null) => ({
  totalCount: group?.membershipsCount ?? group?.memberships?.totalCount,
  pendingCount: group?.pending?.totalCount,
  accountMembership: extractAccountMembership(group),
  membersSample: extractMembers(group),
});

export const extractMembers = (group?: MembershipQuery | null) =>
  (
    (
      group as
        | (Partial<GroupMembersFragment> & Partial<GroupMembersInfoFragment>)
        | null
        | undefined
    )?.memberships?.edges || []
  ).map(edge => ({
    membershipId: edge.node.id,
    userRole: edge.node.userRole,
    membershipStatus: edge.node.membershipStatus,
    ...edge.node.user,
  }));

export const extractAccountMembership = (
  group?: AccountMembershipFragment | null
) =>
  group?.accountMembership
    ? {
        ..._.omit('id', group.accountMembership),
        membershipId: group.accountMembership.id,
      }
    : undefined;

export const getMemberships = (groups: MembershipList[]) =>
  Object.fromEntries(
    groups.map(group => [group.slug, { group, fetching: false }])
  );

export const generateIndexedMembers = (memberships: Membership[]) =>
  _.keyBy(member => member.membershipId, memberships);
