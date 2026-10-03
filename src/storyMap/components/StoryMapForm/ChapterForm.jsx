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
import { ALIGNMENTS } from 'terraso-web-client/storyMap/storyMapConstants';
import { chapterHasVisualMedia } from 'terraso-web-client/storyMap/storyMapUtils';

// The chapter card layout wrapper. The map configuration (location, style,
// layers) and the alignment buttons live in the Configure Chapter sidebar.
const ChapterConfig = props => {
  const { chapter, children } = props;
  const hasVisualMedia = chapterHasVisualMedia(chapter);

  return (
    <Grid container sx={{ width: hasVisualMedia ? '50vw' : '35vw' }}>
      <Grid size={12}>{children}</Grid>
    </Grid>
  );
};

const ChapterForm = props => {
  const { record, onFieldChange, onFieldBlur } = props;
  const { t } = useTranslation();
  const { init } = useStoryMapConfigActionsContext();
  const [isNew, setIsNew] = useState(false);

  const classList = useMemo(
    () =>
      [
        'step-container',
        'active',
        ALIGNMENTS[record.alignment] || 'centered',
        ...(record.hidden ? ['hidden'] : []),
      ].join(' '),
    [record.alignment, record.hidden]
  );

  useEffect(() => {
    if (init.current) {
      setIsNew(true);
    }
  }, [record.id, init]);

  return (
    <Box
      className={classList}
      direction="row"
      component="section"
      aria-label={t('storyMap.view_chapter_label', {
        title: record.title || t('storyMap.form_chapter_no_title_label'),
      })}
      sx={{ opacity: 0.99 }}
    >
      <ChapterConfig chapter={record}>
        <Stack
          className="story-theme step-content"
          spacing={1}
          sx={{ maxWidth: 'none' }}
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
    </Box>
  );
};

export default memo(ChapterForm);
