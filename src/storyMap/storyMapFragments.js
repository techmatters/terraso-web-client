export const storyMapFields = `
  fragment storyMapFields on StoryMapNode {
    id
    slug
    title
    isPublished
    configuration
    createdAt
    updatedAt
    publishedAt
    createdBy {
      id
      lastName
      firstName
    }
  }
`;
