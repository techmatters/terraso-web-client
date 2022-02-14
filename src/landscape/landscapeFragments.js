import { accountMembership, groupMembersInfo } from 'group/groupFragments';

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
