/*
 * Copyright © 2021-2023 Technology Matters
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
import _ from 'lodash/fp';
import {
  extractAccountMembership,
  extractMembershipInfo,
} from 'terraso-client-shared/collaboration/membershipsUtils';

import { REACT_APP_BASE_URL } from 'config';

export const chapterHasVisualMedia = chapter => {
  const { media } = chapter;
  return media && _.includes(media.type, ['image', 'embedded']);
};

export const isChapterEmpty = chapter => {
  const { title, description, media } = chapter;
  return _.isEmpty(title) && _.isEmpty(description) && _.isEmpty(media);
};

export const generateStoryMapUrl = storyMap => {
  const { storyMapId, slug } = storyMap;
  return `/tools/story-maps/${storyMapId}/${slug}`;
};

export const generateStoryMapEmbedUrl = storyMap => {
  const { storyMapId, slug } = storyMap;
  return `${REACT_APP_BASE_URL}/tools/story-maps/${storyMapId}/${slug}/embed`;
};

export const generateStoryMapEditUrl = storyMap =>
  `${generateStoryMapUrl(storyMap)}/edit`;

export const extractStoryMap = storyMap => ({
  ..._.omit(['membershipList'], storyMap),
  accountMembership: extractAccountMembership(storyMap.membershipList),
  membershipInfo: extractMembershipInfo(storyMap.membershipList),
});
