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

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import {
  Box,
  Button,
  ButtonGroup,
  Grid,
  IconButton,
  Stack,
} from '@mui/material';

import { withProps } from 'terraso-web-client/react-hoc';

import EditableMedia from 'terraso-web-client/storyMap/components/StoryMapForm/EditableMedia';
import EditableRichText from 'terraso-web-client/storyMap/components/StoryMapForm/EditableRichText';
import EditableText from 'terraso-web-client/storyMap/components/StoryMapForm/EditableText';
import { useStoryMapConfigActionsContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import { toMapLayers } from 'terraso-web-client/storyMap/mapLayerUtils';
import { ALIGNMENTS } from 'terraso-web-client/storyMap/storyMapConstants';
import { chapterHasVisualMedia } from 'terraso-web-client/storyMap/storyMapUtils';

const ConfigButton = withProps(IconButton, {
  size: 'small',
  sx: {
    bgcolor: 'gray.lite1',
    borderRadius: 0,
    '&:hover': { bgcolor: 'gray.mid', borderRadius: 0 },
  },
});
const ChapterConfig = props => {
  const { t } = useTranslation();
  const {
    onAlignmentChange,
    chapter,
    onLocationChange,
    onMapStyleChange,
    onMapLayersChange,
    children,
  } = props;
  const { openMapConfig, closeMapConfig } = useStoryMapConfigActionsContext();

  const options = useMemo(
    () => [
      {
        label: t('storyMap.form_chapter_alignment_left'),
        Icon: AlignHorizontalLeftIcon,
        value: 'left',
      },
      {
        label: t('storyMap.form_chapter_alignment_center'),
        Icon: AlignHorizontalCenterIcon,
        value: 'center',
      },
      {
        label: t('storyMap.form_chapter_alignment_right'),
        Icon: AlignHorizontalRightIcon,
        value: 'right',
      },
    ],
    [t]
  );

  const onLocationClose = useCallback(() => {
    closeMapConfig();
  }, [closeMapConfig]);

  const onLocationChangeWrapper = useCallback(
    ({ location, mapStyle, mapLayerRows }) => {
      onLocationChange(location);
      onMapStyleChange(mapStyle);
      onMapLayersChange({ mapLayerRows });
      onLocationClose();
    },
    [onLocationChange, onLocationClose, onMapStyleChange, onMapLayersChange]
  );

  const onLocationClick = useCallback(() => {
    // The fullscreen map configuration overlay is hosted over the shared
    // editor map (see StoryMapForm/StoryMap). The session API lives in the
    // config actions context (always mounted above this form) — the trigger
    // can never hit a silent dead button.
    openMapConfig({
      location: chapter.location,
      mapLayers: chapter.mapLayers,
      dataLayerConfigId: chapter.dataLayerConfigId,
      title: chapter.title,
      chapterId: chapter.id,
      alignment: chapter.alignment,
      onConfirm: onLocationChangeWrapper,
    });
  }, [openMapConfig, chapter, onLocationChangeWrapper]);

  const hasVisualMedia = chapterHasVisualMedia(chapter);

  return (
    <>
      <Grid
        container
        sx={{
          width: hasVisualMedia ? '50vw' : '35vw',
          // Cap the container so its 11/12 content cell lands exactly on the
          // chapter content card's max border box: mirror .step-content in
          // StoryMap.css (max-width 35vw + 50px x2 padding = calc(35vw +
          // 100px)); the cell is 11/12 of the container, so the container cap
          // is that width x 12/11. Keep this in sync with StoryMap.css.
          maxWidth: 'calc((35vw + 100px) * 12 / 11)',
        }}
      >
        <Grid size={11}>
          <Button
            variant="contained"
            onClick={onLocationClick}
            startIcon={<GpsFixedIcon />}
            sx={{
              borderRadius: '0px',
              mb: 1,
              width: '100%',
            }}
          >
            {t('storyMap.form_chapter_location_button')}
          </Button>
        </Grid>
        <Grid size={11}>{children}</Grid>
        <Grid size={1}>
          <ButtonGroup
            orientation="vertical"
            aria-label={t('storyMap.form_chapter_alignment_buttons')}
          >
            {options.map(option => (
              <ConfigButton
                key={option.value}
                title={option.label}
                onClick={() => onAlignmentChange(option.value)}
              >
                <option.Icon />
              </ConfigButton>
            ))}
          </ButtonGroup>
        </Grid>
      </Grid>
    </>
  );
};

const ChapterForm = props => {
  const { record, onFieldChange, onFieldBlur } = props;
  const { t } = useTranslation();
  const { setConfig, init } = useStoryMapConfigActionsContext();
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

  const onMapStyleChange = useCallback(
    style => {
      setConfig(_.set('style', style));
    },
    [setConfig]
  );

  // Writes ONLY `mapLayers` + the `dataLayers` payload: the compat fields
  // (dataLayerConfigId/onChapterEnter/onChapterExit) are derived from these at
  // the config write boundary (syncTransitionLayerFields).
  const onMapLayersChange = useCallback(
    ({ mapLayerRows }) => {
      const mapLayers = toMapLayers(mapLayerRows.map(({ layerId }) => layerId));
      const dataLayerConfigs = _.keyBy(
        'id',
        mapLayerRows.map(({ config }) => config).filter(Boolean)
      );

      setConfig(config => ({
        ...config,
        dataLayers: { ...config.dataLayers, ...dataLayerConfigs },
        chapters: config.chapters.map(chapter =>
          chapter.id === record.id ? { ...chapter, mapLayers } : chapter
        ),
      }));
    },
    [record.id, setConfig]
  );

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
      <ChapterConfig
        chapter={record}
        onAlignmentChange={onFieldChange('alignment')}
        onLocationChange={onFieldChange('location')}
        onMapStyleChange={onMapStyleChange}
        onMapLayersChange={onMapLayersChange}
      >
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
