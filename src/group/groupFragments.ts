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

export const groupFields = /* GraphQL */ `
  fragment groupFields on GroupNode {
    id
    slug
    name
    description
    email
    website
    email
  }
`;

export const groupsListFields = /* GraphQL */ `
  fragment groupsListFields on GroupNode {
    slug
    name
  }
`;

export const groupDataEntries = /* GraphQL */ `
  fragment groupDataEntries on GroupNode {
    sharedResources {
      edges {
        node {
          id
          shareAccess
          shareUrl
          source {
            ... on DataEntryNode {
              ...dataEntry
              ...dataEntryVisualizations
            }
          }
        }
      }
    }
  }
`;

export const groupMembershipList = /* GraphQL */ `
  fragment groupMembershipList on GroupNode {
    membershipList {
      membershipType
      membershipsCount
      ...accountCollaborationMembership
    }
  }
`;

export const groupMembershipListWithMembersSample = /* GraphQL */ `
  fragment groupMembershipListWithMembersSample on GroupNode {
    membershipList {
      membershipType
      membershipsCount
      ...accountCollaborationMembership
      ...collaborationMembershipsPending
      memberships(
        user_Email_Not: $accountEmail
        first: $memberSampleCount
        membershipStatus: APPROVED
      ) {
        edges {
          node {
            ...collaborationMembershipFields
          }
        }
      }
    }
  }
`;
