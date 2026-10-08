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

import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Grid, Stack } from '@mui/material';

import EditableMedia from 'terraso-web-client/storyMap/components/StoryMapForm/EditableMedia';
import EditableRichText from 'terraso-web-client/storyMap/components/StoryMapForm/EditableRichText';
import EditableText from 'terraso-web-client/storyMap/components/StoryMapForm/EditableText';
import { useStoryMapConfigActionsContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import {
  CHAPTER_ONLY_CONTENT_MAX_WIDTH,
  CHAPTER_ONLY_CONTENT_MAX_WIDTH_VAR,
  chapterShell,
} from 'terraso-web-client/storyMap/storyMapConstants';
import { chapterHasVisualMedia } from 'terraso-web-client/storyMap/storyMapUtils';

// The chapter card layout wrapper. The map configuration (location, style,
// layers) and the alignment buttons live in the Configure Chapter sidebar.
// A `chapterOnly` chapter spans the full shell width: the viewer's cap rule
// on `.step-content` (46rem, centered) applies to the editor's inputs too,
// so authoring happens in the same reading column as the published chapter.
const ChapterConfig = props => {
  const { chapter, chapterOnly, children } = props;
  const hasVisualMedia = chapterHasVisualMedia(chapter);

  return (
    <Grid
      container
      sx={{ width: chapterOnly ? '100%' : hasVisualMedia ? '50vw' : '35vw' }}
    >
      <Grid size={12}>{children}</Grid>
    </Grid>
  );
};

const ChapterForm = props => {
  const {
    record,
    onFieldChange,
    onFieldBlur,
    isContained = false,
    isMobile = false,
  } = props;
  const { t } = useTranslation();
  const { init } = useStoryMapConfigActionsContext();
  const [isNew, setIsNew] = useState(false);

  // The editor renders the SAME render modes as the viewer: `chapterShell`
  // is the one policy. `justMap` renders nothing over the map (only the
  // scroll span is kept), `justChapter` is a full-screen editable chapter —
  // theme background covering the map, form centered in the same column as
  // the published content. The alignment buttons live in the Configure
  // Chapter sidebar, so switching back to a card restores this editable
  // card with the config (content included) untouched.
  const policy = useMemo(
    () =>
      chapterShell({
        alignment: record.alignment,
        hidden: record.hidden,
        isMobile,
      }),
    [record.alignment, record.hidden, isMobile]
  );

  const classList = useMemo(
    () =>
      [
        'step-container',
        'active',
        policy.alignmentClass,
        ...(policy.coversMap ? ['story-theme'] : []),
        ...(record.hidden ? ['hidden'] : []),
      ].join(' '),
    [policy.alignmentClass, policy.coversMap, record.hidden]
  );

  useEffect(() => {
    if (init.current) {
      setIsNew(true);
    }
  }, [record.id, init]);

  const spanHeight = policy.spanHeight(isContained);

  return (
    <Box
      className={classList}
      direction="row"
      component="section"
      aria-label={t('storyMap.view_chapter_label', {
        title: record.title || t('storyMap.form_chapter_no_title_label'),
      })}
      sx={{
        opacity: 0.99,
        ...(spanHeight ? { minHeight: spanHeight } : {}),
        ...(policy.coversMap
          ? {
              width: '100%',
              bgcolor: 'var(--story-theme-background)',
              justifyContent: 'center',
              alignItems: 'center',
              [CHAPTER_ONLY_CONTENT_MAX_WIDTH_VAR]:
                CHAPTER_ONLY_CONTENT_MAX_WIDTH,
            }
          : {}),
      }}
    >
      {policy.rendersContent && (
        <ChapterConfig chapter={record} chapterOnly={policy.coversMap}>
          <Stack
            className="story-theme step-content"
            spacing={1}
            // Classic editable cards keep their full editing width (the
            // inline `none` beats the 35vw rule). A `justChapter` form drops
            // the override so the viewer's var-driven cap and centering
            // apply to the inputs too.
            sx={policy.coversMap ? { width: '100%' } : { maxWidth: 'none' }}
          >
            <EditableText
              placeholder={t('storyMap.form_chapter_title_placeholder')}
              Component="h3"
              value={record.title}
              onChange={onFieldChange('title')}
              onBlur={onFieldBlur('title')}
              focus={isNew}
              inputProps={{
                inputProps: {
                  'aria-label': t('storyMap.form_chapter_title_label'),
                },
              }}
            />
            <EditableMedia
              label={t('storyMap.form_chapter_media_label')}
              value={record.media}
              onChange={onFieldChange('media')}
            />
            <EditableRichText
              label={t('storyMap.form_chapter_description_label')}
              placeholder={t('storyMap.form_chapter_description_placeholder')}
              value={record.description}
              onChange={onFieldChange('description')}
              onBlur={onFieldBlur('description')}
            />
          </Stack>
        </ChapterConfig>
      )}
    </Box>
  );
};

export default memo(ChapterForm);
