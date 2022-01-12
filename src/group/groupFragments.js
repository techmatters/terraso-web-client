export const groupFields = `
  fragment groupFields on GroupNode {
    id
    slug
    name
    description
    email
    website
    email
  }
`

export const groupMembers = `
  fragment groupMembers on GroupNode {
    memberships {
      edges {
        node {
          id
          user {
            email
            firstName
            lastName
            profileImage
          }
        }
      }
    }
  }
`
