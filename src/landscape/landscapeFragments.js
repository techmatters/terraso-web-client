import { groupMembers } from 'group/groupFragments'

export const defaultFields = `
  fragment defaultFields on LandscapeNode {
    id
    slug
    name
    location
    description
    website
  }
`

export const defaultGroup = `
  fragment defaultGroup on LandscapeNode {
    defaultGroup: associatedGroups(isDefaultLandscapeGroup: true) {
      edges {
        node {
          group {
            id
            slug
            ...groupMembers
          }
        }
      }
    }
  }
  ${groupMembers}
`
