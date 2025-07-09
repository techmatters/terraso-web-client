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
export const storyMapFields = /* GraphQL */ `
  fragment storyMapFields on StoryMapNode {
    id
    slug
    storyMapId
    title
    isPublished
    configuration
    createdAt
    updatedAt
    publishedAt
    createdBy {
      ...userFields
    }
    membershipList {
      ...collaborationMemberships
      ...accountCollaborationMembership
    }
  }
`;

export const storyMapPublishedFields = /* GraphQL */ `
  fragment storyMapPublishedFields on StoryMapNode {
    ...storyMapFields
    publishedConfiguration
  }
`;

export const storyMapMetadataFields = /* GraphQL */ `
  fragment storyMapMetadataFields on StoryMapNode {
    id
    slug
    storyMapId
    title
    isPublished
    createdAt
    updatedAt
    publishedAt
    createdBy {
      id
      lastName
      firstName
    }
    membershipList {
      membershipsCount
      ...accountCollaborationMembership
      memberships(user_Email_Not: $accountEmail, first: 2) {
        edges {
          node {
            ...collaborationMembershipFields
          }
        }
      }
    }
  }
`;

export const storyMapMetadataFieldsNoEmail = /* GraphQL */ `
  fragment storyMapMetadataFieldsNoEmail on StoryMapNode {
    id
    slug
    storyMapId
    title
    isPublished
    createdAt
    updatedAt
    publishedAt
    createdBy {
      id
      lastName
      firstName
    }
  }
`;
