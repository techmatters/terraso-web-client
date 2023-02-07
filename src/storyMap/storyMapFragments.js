export const storyMapFields = `
  fragment storyMapFields on StoryMapNode {
    id
    slug
    title
    isPublished
    configuration
    createdAt
    updatedAt
    createdBy {
      id
      lastName
      firstName
    }
  }
`;
