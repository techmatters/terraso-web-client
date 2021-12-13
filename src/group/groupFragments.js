export const groupMembers = `
  fragment groupMembers on GroupNode {
    memberships {
      edges {
        node {
          user {
            email
            firstName
            lastName
          }
        }
      }
    }
  }
`
