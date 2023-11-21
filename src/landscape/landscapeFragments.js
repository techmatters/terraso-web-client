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

export const landscapeFields = /* GraphQL */ `
  fragment landscapeFields on LandscapeNode {
    id
    slug
    name
    location
    description
    email
    website
    profileImage
  }
`;

export const landscapeProfileFields = /* GraphQL */ `
  fragment landscapeProfileFields on LandscapeNode {
    id
    slug
    name
    location
    description
    email
    website
    areaScalarHa
    areaTypes
    population
    partnershipStatus
    profileImage
    profileImageDescription
    taxonomyTerms {
      edges {
        node {
          type
          valueOriginal
          ...taxonomyTermLanguages
        }
      }
    }
    associatedGroups {
      edges {
        node {
          isPartnership
          partnershipYear
          group {
            slug
            name
          }
        }
      }
    }
    associatedDevelopmentStrategy {
      edges {
        node {
          objectives
          opportunities
          problemSitutation
          interventionStrategy
        }
      }
    }
  }
`;

export const landscapePartnershipField = /* GraphQL */ `
  fragment landscapePartnershipField on LandscapeNode {
    partnershipStatus
    associatedGroups(isPartnership: true) {
      edges {
        node {
          isPartnership
          partnershipYear
          group {
            slug
            name
          }
        }
      }
    }
  }
`;

export const landscapeMembershipList = /* GraphQL */ `
  fragment landscapeMembershipList on LandscapeNode {
    membershipList {
      membershipsCount
      ...accountCollaborationMembership
    }
  }
`;

export const defaultGroupWithMembersSample = /* GraphQL */ `
  fragment defaultGroupWithMembersSample on LandscapeNode {
    defaultGroup {
      id
      slug
      ...groupMembersInfo
      ...accountMembership
    }
  }
`;

export const landscapeDataEntries = /* GraphQL */ `
  fragment landscapeDataEntries on LandscapeNode {
    sharedResources {
      edges {
        node {
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
