export const dataEntry = `
  fragment dataEntry on DataEntryNode {
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
`;

export const visualizationConfig = `
  fragment visualizationConfig on VisualizationConfigNode {
    id
    configuration
    createdAt
    createdBy {
      id
      lastName
      firstName
    }
  }
`;
