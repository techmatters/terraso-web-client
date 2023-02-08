import _ from 'lodash/fp';

export const chapterHasVisualMedia = chapter => {
  const { media } = chapter;
  return media && _.includes(media.type, ['image', 'embedded']);
};
