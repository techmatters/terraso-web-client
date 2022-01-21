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
`;

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
`;

export const accountMembership = `
  fragment accountMembership on GroupNode { 
    accountMembership: memberships(user_Email_In: [$accountEmail]) {
      edges {
        node {
          userRole
        }
      }
    }
  }
`;
