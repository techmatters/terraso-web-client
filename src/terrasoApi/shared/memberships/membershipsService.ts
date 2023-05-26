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
import _ from 'lodash/fp';
import { graphql } from 'terrasoApi/shared/graphqlSchema';
import type { MembershipAddMutationInput } from 'terrasoApi/shared/graphqlSchema/graphql';
import { Membership } from 'terrasoApi/shared/memberships/membershipsSlice';
import {
  extractMembers,
  extractMembersInfo,
} from 'terrasoApi/shared/memberships/membershipsUtils';
import * as terrasoApi from 'terrasoApi/shared/terrasoApi/api';

export const fetchMembers = (slug: string) => {
  const query = graphql(`
    query groupMembers($slug: String!) {
      groups(slug: $slug) {
        edges {
          node {
            ...groupMembers
          }
        }
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, { slug })
    .then(resp => resp.groups?.edges.at(0)?.node || Promise.reject('not_found'))
    .then(group => ({
      members: extractMembers(group),
    }));
};

export const removeMember = (member: Membership) => {
  const query = graphql(`
    mutation deleteMembership($input: MembershipDeleteMutationInput!) {
      deleteMembership(input: $input) {
        membership {
          group {
            ...groupMembers
          }
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: { id: member.membershipId },
    })
    .then(resp => resp.deleteMembership.membership!.group)
    .then(group => ({
      members: extractMembers(group),
    }));
};

export const updateMember = ({ member }: { member: Membership }) => {
  const query = graphql(`
    mutation updateMembership($input: MembershipUpdateMutationInput!) {
      updateMembership(input: $input) {
        membership {
          group {
            ...groupMembers
          }
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: { ...member, id: member.membershipId },
    })
    .then(resp => resp.updateMembership.membership!.group)
    .then(group => ({
      members: extractMembers(group),
    }));
};

export const joinMembershipList = ({
  groupSlug,
  userEmail,
  userRole = 'MEMBER',
}: MembershipAddMutationInput) => {
  const query = graphql(`
    mutation addMembership($input: MembershipAddMutationInput!) {
      addMembership(input: $input) {
        membership {
          group {
            ...groupFields
            ...groupMembersInfo
            ...accountMembership
          }
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: {
        userEmail,
        groupSlug,
        userRole,
      },
    })
    .then(resp => resp.addMembership.membership?.group)
    .then(group => group || Promise.reject('not_found'))
    .then(group => ({
      ..._.omit(
        ['memberships', 'accountMembership', 'membershipsCount'],
        group
      ),
      membersInfo: extractMembersInfo(group),
    }));
};

export const leaveMembershipList = ({ membershipId }: Membership) => {
  const query = graphql(`
    mutation leaveGroup($input: MembershipDeleteMutationInput!) {
      deleteMembership(input: $input) {
        membership {
          group {
            ...groupFields
            ...groupMembersInfo
            ...accountMembership
          }
        }
        errors
      }
    }
  `);
  return terrasoApi
    .requestGraphQL(query, {
      input: { id: membershipId },
    })
    .then(resp => resp.deleteMembership.membership?.group)
    .then(group => group || Promise.reject('not_found'))
    .then(group => ({
      ..._.omit(
        ['memberships', 'accountMembership', 'membershipsCount'],
        group
      ),
      membersInfo: extractMembersInfo(group),
    }));
};
