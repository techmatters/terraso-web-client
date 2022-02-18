export const userFields = `
  fragment userFields on UserNode {
    id
    email
    firstName
    lastName
    profileImage
  }
`;

export const userPreferencesFields = `
  fragment userPreferencesFields on UserPreferenceNode {
    key
    value
  }

`;

export const userPreferences = `
  fragment userPreferences on UserNode {
    preferences {
      edges {
        node {
          ...userPreferencesFields
        }
      }
    }
  }
  ${userPreferencesFields}
`;
