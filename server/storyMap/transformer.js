/*
 * Copyright © 2025 Technology Matters
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

const { baseUrl } = require('../config');

const STORY_MAP_FALLBACK_IMAGE_PATH = '/storyMap/terraso-story-maps-img.jpg';
const STORY_MAP_FALLBACK_TITLE =
  'Terraso Story Maps - Free and Open Source Storymapping';
const STORY_MAP_TITLE_SUFFIX = ' | Terraso Story Maps';
const STORY_MAP_FALLBACK_DESCRIPTION =
  'an interactive story map made with Terraso Story Maps, the free, open-source app for place-based storytelling.';
const MAX_OG_DESCRIPTION_LENGTH = 150;

const getFallbackImageUrl = () =>
  `${(baseUrl || '').replace(/\/$/, '')}${STORY_MAP_FALLBACK_IMAGE_PATH}`;

const toCleanText = value =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const getPlainTextFromRichContent = content => {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map(getPlainTextFromRichContent).join(' ');
  }

  if (!content || typeof content !== 'object') {
    return '';
  }

  if (typeof content.text === 'string') {
    return content.text;
  }

  if (Array.isArray(content.children)) {
    return getPlainTextFromRichContent(content.children);
  }

  return '';
};

const truncateForOg = text => {
  if (!text || text.length <= MAX_OG_DESCRIPTION_LENGTH) {
    return text;
  }

  const candidate = text.slice(0, MAX_OG_DESCRIPTION_LENGTH).trimEnd();
  const lastSpaceIndex = candidate.lastIndexOf(' ');
  const truncateAt =
    lastSpaceIndex > MAX_OG_DESCRIPTION_LENGTH * 0.6
      ? lastSpaceIndex
      : MAX_OG_DESCRIPTION_LENGTH;

  return `${candidate.slice(0, truncateAt)}...`;
};

const getFirstChapterDescriptionPreview = chapters => {
  if (!Array.isArray(chapters)) {
    return '';
  }

  for (const chapter of chapters) {
    const chapterDescription = toCleanText(
      getPlainTextFromRichContent(chapter?.description)
    );

    if (chapterDescription) {
      return truncateForOg(chapterDescription);
    }
  }

  return '';
};

const isImageMedia = media =>
  media?.signedUrl &&
  (media.type === 'image' || media.type?.startsWith('image/'));

const getFirstChapterImageUrl = chapters => {
  if (!Array.isArray(chapters)) {
    return '';
  }

  for (const chapter of chapters) {
    if (isImageMedia(chapter?.media)) {
      return chapter.media.signedUrl;
    }
  }

  return '';
};

const getStoryMapMetaDescription = storyMapConfig => {
  const shortDescription = toCleanText(storyMapConfig.description);
  const subtitle = toCleanText(storyMapConfig.subtitle);
  const title = toCleanText(storyMapConfig.title) || STORY_MAP_FALLBACK_TITLE;

  return (
    shortDescription ||
    subtitle ||
    getFirstChapterDescriptionPreview(storyMapConfig.chapters) ||
    `${title}: ${STORY_MAP_FALLBACK_DESCRIPTION}`
  );
};

const parseConfig = node => {
  if (!node.publishedConfiguration) {
    return {};
  }
  try {
    return JSON.parse(node.publishedConfiguration);
  } catch (e) {
    return {};
  }
};

const getStoryMapTitle = storyMapConfig => {
  const storyMapTitle = toCleanText(storyMapConfig.title);

  if (!storyMapTitle) {
    return STORY_MAP_FALLBACK_TITLE;
  }

  return storyMapTitle.endsWith(STORY_MAP_TITLE_SUFFIX)
    ? storyMapTitle
    : `${storyMapTitle}${STORY_MAP_TITLE_SUFFIX}`;
};

const buildMetaTags = node => {
  const storyMapConfig = parseConfig(node);

  const title = getStoryMapTitle(storyMapConfig);
  const description = getStoryMapMetaDescription(storyMapConfig);
  const image =
    storyMapConfig.featuredImage?.signedUrl ||
    getFirstChapterImageUrl(storyMapConfig.chapters) ||
    getFallbackImageUrl();

  return { title, description, image };
};

module.exports = { buildMetaTags };
