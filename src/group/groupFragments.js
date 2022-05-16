import { userFields } from 'user/userFragments';

const MEMBERS_INFO_SAMPLE_SIZE = 5;

export const dataEntries = `
  fragment dataEntries on GroupNode {
    dataEntries {
      edges {
        node {
          id
          slug
          name
          description
          resourceType
          url
          createdAt
          createdBy {
            lastName
            firstName
          }
        }
      }
    }
  }
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
  }
`;

export const groupMembersInfo = `
  fragment groupMembersInfo on GroupNode {
    memberships(first: ${MEMBERS_INFO_SAMPLE_SIZE}) {
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
        }
      }
    }
  }
`;
