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

import React, { useCallback, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { Box, Button, Stack } from '@mui/material';

import {
  getLayerOpacity,
  LAYER_TYPES,
} from 'sharedData/visualization/components/VisualizationMapLayer';

import StoryMapOutline from '../StoryMapOutline';
import EditableText from './EditableText';
import MapLocationDialog from './MapLocationDialog';
import { useStoryMapConfigContext } from './storyMapConfigContext';

const TitleForm = props => {
  const { t } = useTranslation();
  const { setConfig } = useStoryMapConfigContext();
  const [locationOpen, setLocationOpen] = useState(false);
  const { config } = props;

  const inputProps = useMemo(
    () => ({
      inputProps: {
        style: {
          textAlign: 'center',
        },
      },
    }),
    []
  );

  const chapters = useMemo(
    () =>
      config.chapters.map((chapter, index) => ({
        chapter,
        index,
      })),
    [config.chapters]
  );

  const onFieldChange = useCallback(
    field => value => {
      setConfig(_.set(field, value));
    },
    [setConfig]
  );

  const onDataLayerChange = useCallback(
    dataLayerConfig => {
      const baseEvents = dataLayerConfig
        ? LAYER_TYPES.map(name => ({
            layer: `${dataLayerConfig.id}-${name}`,
            opacity: getLayerOpacity(name, dataLayerConfig),
            duration: 0,
          }))
        : [];

      const onChapterEnter = baseEvents;
      const onChapterExit = baseEvents.map(_.set('opacity', 0));

      setConfig(
        _.flow(
          dataLayerConfig
            ? _.set(`dataLayers.${dataLayerConfig.id}`, dataLayerConfig)
            : _.identity,
          _.set('titleTransition.dataLayerConfigId', dataLayerConfig?.id),
          _.set('titleTransition.onChapterEnter', onChapterEnter),
          _.set('titleTransition.onChapterExit', onChapterExit)
        )
      );
    },
    [setConfig]
  );

  const onLocationClick = useCallback(() => {
    setLocationOpen(true);
  }, []);

  const onLocationClose = useCallback(() => {
    setLocationOpen(false);
  }, []);

  const onLocationChangeWrapper = useCallback(
    ({ location, mapStyle, dataLayerConfig }) => {
      onFieldChange('titleTransition.location')(location);
      onFieldChange('style')(mapStyle);
      onDataLayerChange(dataLayerConfig);

      onLocationClose();
    },
    [onFieldChange, onLocationClose, onDataLayerChange]
  );

  const onTitleBlur = useCallback(
    () => onFieldChange('title')(config.title.trim()),
    [config.title, onFieldChange]
  );

  return (
    <Box
      id="story-map-title"
      className="step active title"
      component="section"
      aria-label={t('storyMap.view_title_label', {
        title: config.title || t('storyMap.form_no_title_label'),
      })}
      sx={{ opacity: 0.99, pb: '35vh' }}
    >
      {locationOpen && (
        <MapLocationDialog
          open={locationOpen}
          location={config.titleTransition?.location}
          dataLayerConfig={_.get(
            `dataLayers.${_.get('titleTransition.dataLayerConfigId', config)}`,
            config
          )}
          title={t('storyMap.form_title_location_dialog_title')}
          onClose={onLocationClose}
          onConfirm={onLocationChangeWrapper}
        />
      )}

      <Button
        variant="contained"
        startIcon={<GpsFixedIcon />}
        onClick={onLocationClick}
        sx={{ borderRadius: '0px', mb: 1, width: '100%' }}
      >
        {t('storyMap.form_title_location_button')}
      </Button>
      <Stack
        className={`${config.theme} step-content`}
        spacing={1}
        sx={{ p: 2, pr: 3 }}
      >
        <EditableText
          placeholder={t('storyMap.form_title_placeholder')}
          label={t('storyMap.form_title_label')}
          Component="h1"
          value={config.title}
          onChange={onFieldChange('title')}
          onBlur={onTitleBlur}
          inputProps={{
            ...inputProps,
            inputProps: {
              'aria-label': t('storyMap.form_title_aria_label'),
              sx: {
                textAlign: 'center',
              },
            },
          }}
        />
        <EditableText
          placeholder={t('storyMap.form_subtitle_placeholder')}
          Component="h2"
          value={config.subtitle}
          onChange={onFieldChange('subtitle')}
          inputProps={{
            ...inputProps,
            inputProps: {
              'aria-label': t('storyMap.form_subtitle_aria_label'),
              sx: {
                textAlign: 'center',
              },
            },
          }}
        />
        <EditableText
          placeholder={t('storyMap.form_byline_placeholder')}
          Component="p"
          value={config.byline}
          onChange={onFieldChange('byline')}
          inputProps={{
            ...inputProps,
            inputProps: {
              'aria-label': t('storyMap.form_byline_label'),
            },
          }}
        />
        <StoryMapOutline chapters={chapters} />
      </Stack>
    </Box>
  );
};

export default TitleForm;
