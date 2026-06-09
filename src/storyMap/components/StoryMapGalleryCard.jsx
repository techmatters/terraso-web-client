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
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
} from '@mui/material';

import { generateStoryMapUrl } from 'terraso-web-client/storyMap/storyMapUtils';

const STORY_MAP_FALLBACK_IMAGE = '/storyMap/terraso-story-maps-img.jpg';
const STORY_MAP_FALLBACK_DESCRIPTION =
  'Inspire your audience with a free, easy to use, and powerful web app for place-based storytelling. Share data, media, and narratives on a map to ground your story in the land.';

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

const getFirstChapterDescriptionPreview = chapters => {
  if (!Array.isArray(chapters)) {
    return '';
  }

  for (const chapter of chapters) {
    const chapterDescription = toCleanText(
      getPlainTextFromRichContent(chapter?.description)
    );

    if (chapterDescription) {
      return chapterDescription;
    }
  }

  return '';
};

const getStoryMapTitle = storyMap => storyMap.config?.title || storyMap.title;

const getStoryMapImage = storyMap =>
  storyMap.config?.featuredImage?.signedUrl || STORY_MAP_FALLBACK_IMAGE;

const getStoryMapImageAlt = storyMap =>
  storyMap.config?.featuredImage?.description || getStoryMapTitle(storyMap);

const getStoryMapDescription = storyMap => {
  const description = toCleanText(storyMap.config?.description);

  if (description) {
    return description;
  }

  return (
    getFirstChapterDescriptionPreview(storyMap.config?.chapters) ||
    STORY_MAP_FALLBACK_DESCRIPTION
  );
};

const StoryMapGalleryCard = ({ storyMap }) => {
  return (
    <Card
      sx={{
        border: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow:
          '0px 4px 8px rgba(0, 0, 0, 0.02), 0px 6px 12px rgba(0, 0, 0, 0.03)',
      }}
    >
      <CardActionArea
        component="a"
        href={generateStoryMapUrl(storyMap)}
        sx={{ alignItems: 'stretch' }}
      >
        <CardMedia
          component="img"
          image={getStoryMapImage(storyMap)}
          alt={getStoryMapImageAlt(storyMap)}
          sx={{ height: 190 }}
        />
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1,
            p: 3,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Lato, Helvetica, Arial, sans-serif',
              fontWeight: 700,
              fontSize: '1.5rem',
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: '145%',
              letterSpacing: '-0.02em',
              color: 'rgba(0, 0, 0, 0.87)',
            }}
          >
            {getStoryMapTitle(storyMap)}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: 'Lato, Helvetica, Arial, sans-serif',
              fontWeight: 400,
              fontSize: '1.125rem',
              lineHeight: '140%',
              letterSpacing: '-0.005em',
              color: 'rgba(0, 0, 0, 0.87)',
            }}
          >
            {getStoryMapDescription(storyMap)}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default StoryMapGalleryCard;
