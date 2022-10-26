import { accountMembership, groupMembersInfo } from 'group/groupFragments';
import { taxonomyTermLanguages } from 'taxonomies/taxonomiesFragments';

export const landscapeFields = `
  fragment landscapeFields on LandscapeNode {
    id
    slug
    name
    location
    description
    website
    areaPolygon
  }
`;

export const landscapeProfileFields = `
  fragment landscapeProfileFields on LandscapeNode {
    areaTypes
    population
    partnershipStatus
    taxonomyTerms {
      edges {
        node {
          type
          valueOriginal
          ...taxonomyTermLanguages
        }
      }
    }
    associatedGroups(isDefaultLandscapeGroup: false) {
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
  ${taxonomyTermLanguages}
`;

export const defaultGroup = `
  fragment defaultGroup on LandscapeNode {
    defaultGroup: associatedGroups(isDefaultLandscapeGroup: true) {
      edges {
        node {
          group {
            id
            slug
            ...groupMembersInfo
            ...accountMembership
          }
        }
      }
    }
  }
  ${groupMembersInfo}
  ${accountMembership}
`;
