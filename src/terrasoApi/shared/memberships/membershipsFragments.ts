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

export const groupMembersPending = /* GraphQL */ `
  fragment groupMembersPending on GroupNode {
    pending: memberships(membershipStatus: PENDING) {
      totalCount
    }
  }
`;

export const groupMembersInfo = /* GraphQL */ `
  fragment groupMembersInfo on GroupNode {
    id
    slug
    membershipType
    membershipsCount
    memberships(first: 5, membershipStatus: APPROVED) {
      totalCount
      edges {
        node {
          user {
            ...userFields
          }
        }
      }
    }
  }
`;

export const groupMembers = /* GraphQL */ `
  fragment groupMembers on GroupNode {
    memberships {
      totalCount
      edges {
        node {
          id
          userRole
          membershipStatus
          user {
            ...userFields
          }
        }
      }
    }
  }
`;

export const accountMembership = /* GraphQL */ `
  fragment accountMembership on GroupNode {
    accountMembership {
      id
      userRole
      membershipStatus
    }
  }
`;
