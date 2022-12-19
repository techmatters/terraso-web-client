export const dataEntry = `
  fragment dataEntry on DataEntryNode {
    id
    name
    description
    entryType
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
    title
    slug
    createdAt
    createdBy {
      id
      lastName
      firstName
    }
  }
`;

export const visualizationConfigWithConfiguration = `
  fragment visualizationConfigWithConfiguration on VisualizationConfigNode {
    ...visualizationConfig
    configuration
  }
  ${visualizationConfig}
`;
