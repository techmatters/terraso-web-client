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
import { visualizationConfig } from 'sharedData/sharedDataFragments';
import { userFields } from 'user/userFragments';

const MEMBERS_INFO_SAMPLE_SIZE = 5;

export const dataEntries = `
  fragment dataEntries on GroupNode {
    dataEntries(resourceType_In: $resourceTypes) {
      edges {
        node {
          id
          name
          description
          entryType
          resourceType
          url
          size
          createdAt
          createdBy {
            id
            lastName
            firstName
          }
          visualizations {
            edges {
              node {
                ...visualizationConfig
              }
            }
          }
        }
      }
    }
  }
  ${visualizationConfig}
`;

export const groupFields = `
  fragment groupFields on GroupNode {
    id
    slug
    name
    description
    email
    website
    email
    membershipType
  }
`;

export const groupsListFields = `
  fragment groupsListFields on GroupNode {
    slug
    name
  }
`;

export const groupMembersPending = `
  fragment groupMembersPending on GroupNode {
    pending: memberships(membershipStatus: PENDING) {
      totalCount
    }
  }
`;

export const groupMembersInfo = `
  fragment groupMembersInfo on GroupNode {
    memberships(first: ${MEMBERS_INFO_SAMPLE_SIZE}, membershipStatus: APPROVED) {
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
  ${userFields}
`;

export const groupMembers = `
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
  ${userFields}
`;

export const accountMembership = `
  fragment accountMembership on GroupNode {
    accountMembership: memberships(user_Email_In: [$accountEmail]) {
      edges {
        node {
          id
          userRole
          membershipStatus
        }
      }
    }
  }
`;
