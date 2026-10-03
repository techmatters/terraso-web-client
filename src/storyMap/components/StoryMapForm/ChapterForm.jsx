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
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { Box, Button, Grid, Stack } from '@mui/material';

import EditableMedia from 'terraso-web-client/storyMap/components/StoryMapForm/EditableMedia';
import EditableRichText from 'terraso-web-client/storyMap/components/StoryMapForm/EditableRichText';
import EditableText from 'terraso-web-client/storyMap/components/StoryMapForm/EditableText';
import { MapConfigurationDialog } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapConfigurationDialog';
import { useStoryMapConfigActionsContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import { toMapLayers } from 'terraso-web-client/storyMap/mapLayerUtils';
import { ALIGNMENTS } from 'terraso-web-client/storyMap/storyMapConstants';
import { chapterHasVisualMedia } from 'terraso-web-client/storyMap/storyMapUtils';

const ChapterConfig = props => {
  const { t } = useTranslation();
  const {
    chapter,
    onLocationChange,
    onMapStyleChange,
    onMapLayersChange,
    children,
  } = props;
  const [locationOpen, setLocationOpen] = useState(false);

  const onLocationClick = useCallback(() => {
    setLocationOpen(true);
  }, []);

  const onLocationClose = useCallback(() => {
    setLocationOpen(false);
  }, []);

  const onLocationChangeWrapper = useCallback(
    ({ location, mapStyle, mapLayerRows }) => {
      onLocationChange(location);
      onMapStyleChange(mapStyle);
      onMapLayersChange({ mapLayerRows });
      onLocationClose();
    },
    [onLocationChange, onLocationClose, onMapStyleChange, onMapLayersChange]
  );

  const hasVisualMedia = chapterHasVisualMedia(chapter);

  return (
    <>
      {locationOpen && (
        <MapConfigurationDialog
          open={locationOpen}
          location={chapter.location}
          mapLayers={chapter.mapLayers}
          dataLayerConfigId={chapter.dataLayerConfigId}
          title={chapter.title}
          chapterId={chapter.id}
          onClose={onLocationClose}
          onConfirm={onLocationChangeWrapper}
        />
      )}
      <Grid container sx={{ width: hasVisualMedia ? '50vw' : '35vw' }}>
        <Grid size={12}>
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
        <Grid size={12}>{children}</Grid>
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
