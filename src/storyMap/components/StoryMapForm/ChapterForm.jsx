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

import {
  generateLayerId,
  getLayerOpacity,
  LAYER_TYPES,
} from 'terraso-web-client/sharedData/visualization/components/VisualizationMapLayer';
import EditableMedia from 'terraso-web-client/storyMap/components/StoryMapForm/EditableMedia';
import EditableRichText from 'terraso-web-client/storyMap/components/StoryMapForm/EditableRichText';
import EditableText from 'terraso-web-client/storyMap/components/StoryMapForm/EditableText';
import { MapConfigurationDialog } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapConfigurationDialog';
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
    onDataLayerChange,
    getConfig,
    children,
  } = props;
  const [locationOpen, setLocationOpen] = useState(false);

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

  const onLocationClick = useCallback(() => {
    setLocationOpen(true);
  }, []);

  const onLocationClose = useCallback(() => {
    setLocationOpen(false);
  }, []);

  const onLocationChangeWrapper = useCallback(
    ({ location, mapStyle, dataLayerConfig }) => {
      onLocationChange(location);
      onMapStyleChange(mapStyle);
      onDataLayerChange(dataLayerConfig);
      onLocationClose();
    },
    [onLocationChange, onLocationClose, onMapStyleChange, onDataLayerChange]
  );

  const hasVisualMedia = chapterHasVisualMedia(chapter);

  return (
    <>
      {locationOpen && (
        <MapConfigurationDialog
          open={locationOpen}
          location={chapter.location}
          mapLayerConfig={_.get(
            `dataLayers.${chapter.dataLayerConfigId}`,
            getConfig()
          )}
          title={chapter.title}
          chapterId={chapter.id}
          onClose={onLocationClose}
          onConfirm={onLocationChangeWrapper}
        />
      )}
      <Grid container sx={{ width: hasVisualMedia ? '50vw' : '35vw' }}>
        <Grid size={11}>
          <Button
            variant="contained"
            onClick={onLocationClick}
            startIcon={<GpsFixedIcon />}
            sx={{ borderRadius: '0px', mb: 1, width: '100%' }}
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
  const {
    theme,
    record,
    effectiveRecord,
    bufferedValues,
    init,
    setConfig,
    getConfig,
    onFieldChange,
    onFieldBlur,
  } = props;
  const { t } = useTranslation();
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (init.current) {
      setIsNew(true);
    }
  }, [init, record.id]);

  const onMapStyleChange = useCallback(
    style => {
      setConfig(_.set('style', style));
    },
    [setConfig]
  );

  const onDataLayerChange = useCallback(
    dataLayerConfig => {
      const baseEvents = dataLayerConfig
        ? Object.values(LAYER_TYPES).map(name => ({
            layer: generateLayerId(dataLayerConfig.id, name),
            opacity: getLayerOpacity(name, dataLayerConfig),
            duration: 0,
          }))
        : [];
      const onChapterEnter = baseEvents;
      const onChapterExit = baseEvents.map(_.set('opacity', 0));

      setConfig(config => ({
        ...(dataLayerConfig
          ? _.set(`dataLayers.${dataLayerConfig.id}`, dataLayerConfig, config)
          : config),
        chapters: config.chapters.map(chapter =>
          chapter.id === record.id
            ? {
                ...chapter,
                dataLayerConfigId: dataLayerConfig?.id,
                onChapterEnter,
                onChapterExit,
              }
            : chapter
        ),
      }));
    },
    [record.id, setConfig]
  );

  const classList = useMemo(
    () =>
      [
        'step-container',
        'active',
        ALIGNMENTS[effectiveRecord.alignment] || 'centered',
        ...(record.hidden ? ['hidden'] : []),
      ].join(' '),
    [effectiveRecord.alignment, record.hidden]
  );

  return (
    <Box
      className={classList}
      direction="row"
      component="section"
      aria-label={t('storyMap.view_chapter_label', {
        title: record.title || t('storyMap.form_chapter_no_title_label'),
      })}
    >
      {/* div with ID added because of an Intersection Observer issue with overflow */}
      <div className="step" id={record.id}></div>
      <ChapterConfig
        chapter={effectiveRecord}
        onAlignmentChange={onFieldChange('alignment')}
        onLocationChange={onFieldChange('location')}
        onMapStyleChange={onMapStyleChange}
        onDataLayerChange={onDataLayerChange}
        getConfig={getConfig}
      >
        <Stack
          className={`${theme} step-content`}
          spacing={1}
          style={{ maxWidth: 'none' }}
        >
          <EditableText
            placeholder={t('storyMap.form_chapter_title_placeholder')}
            Component="h3"
            value={bufferedValues.title}
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
            value={bufferedValues.description}
            onChange={onFieldChange('description')}
            onBlur={onFieldBlur('description')}
          />
        </Stack>
      </ChapterConfig>
    </Box>
  );
};

export default memo(ChapterForm);
