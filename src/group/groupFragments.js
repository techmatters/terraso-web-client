import { userFields } from 'user/userFragments';

const MEMBERS_INFO_SAMPLE_SIZE = 5;

export const dataEntries = `
  fragment dataEntries on GroupNode {
    dataEntries {
      edges {
        node {
          id
          name
          description
          resourceType
          url
          size
          createdAt
          createdBy {
            id
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
    membershipType
  }
`;

export const groupMembersPending = `
  fragment groupMembersPending on GroupNode {
    pending: memberships(membershipStatus: "pending") {
      totalCount
    }
  }
`;

export const groupMembersInfo = `
  fragment groupMembersInfo on GroupNode {
    memberships(first: ${MEMBERS_INFO_SAMPLE_SIZE}, membershipStatus: "approved") {
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
          membershipStatus
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
          membershipStatus
        }
      }
    }
  }
`;
