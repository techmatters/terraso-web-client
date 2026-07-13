import {
  generateStoryMapEditUrl,
  generateStoryMapUrl,
} from 'terraso-web-client/storyMap/storyMapUtils';

export const STORY_MAP_FALLBACK_IMAGE = '/storyMap/terraso-story-maps-img.jpg';
export const STORY_MAP_CARD_IMAGE_WIDTH = 184;
export const STORY_MAP_CARD_IMAGE_HEIGHT = 97;

export const getStoryMapImage = storyMapConfig =>
  storyMapConfig?.featuredImage?.signedUrl || STORY_MAP_FALLBACK_IMAGE;

export const getStoryMapImageAlt = (storyMapConfig, title) =>
  storyMapConfig?.featuredImage?.description || title;

export const getTitleDestination = ({
  isStoryMapMembershipPending,
  storyMap,
}) => {
  if (!storyMap.isPublished && isStoryMapMembershipPending) {
    return null;
  }

  return isStoryMapMembershipPending
    ? generateStoryMapUrl(storyMap)
    : generateStoryMapEditUrl(storyMap);
};
