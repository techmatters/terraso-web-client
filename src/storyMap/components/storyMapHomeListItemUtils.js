/*
 * Copyright © 2026 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import {
  generateStoryMapEditUrl,
  generateStoryMapUrl,
} from 'terraso-web-client/storyMap/storyMapUtils';

export {
  getStoryMapImage,
  getStoryMapImageAlt,
  STORY_MAP_FALLBACK_IMAGE,
} from 'terraso-web-client/storyMap/storyMapUtils';
export const STORY_MAP_CARD_IMAGE_WIDTH = 184;
export const STORY_MAP_CARD_IMAGE_ASPECT_RATIO = '184 / 97';
export const STORY_MAP_ROW_ACTIONS_IMAGE_WIDTH = 240;
export const STORY_MAP_DESKTOP_ACTIONS_MEDIA_QUERY =
  '@media (min-width: 1000px)';

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
