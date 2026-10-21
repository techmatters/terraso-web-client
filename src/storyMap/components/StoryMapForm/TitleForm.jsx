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

import { useCallback, useMemo } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { Box, Button, Stack } from '@mui/material';

import EditableText from 'terraso-web-client/storyMap/components/StoryMapForm/EditableText';
import { useStoryMapConfigActionsContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import StoryMapOutline from 'terraso-web-client/storyMap/components/StoryMapOutline';
import { toMapLayers } from 'terraso-web-client/storyMap/mapLayerUtils';
import { STORY_MAP_TITLE_ID } from 'terraso-web-client/storyMap/storyMapConstants';

const TitleForm = props => {
  const { t } = useTranslation();
  const { setConfig, openMapConfig, closeMapConfig } =
    useStoryMapConfigActionsContext();
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

      setConfig(
        _.flow(
          config => ({
            ...config,
            dataLayers: { ...config.dataLayers, ...dataLayerConfigs },
          }),
          _.set('titleTransition.mapLayers', mapLayers)
        )
      );
    },
    [setConfig]
  );

  const onLocationClose = useCallback(() => {
    closeMapConfig();
  }, [closeMapConfig]);

  const onLocationChangeWrapper = useCallback(
    ({ location, mapStyle, mapLayerRows }) => {
      onFieldChange('titleTransition.location')(location);
      onFieldChange('style')(mapStyle);
      onMapLayersChange({ mapLayerRows });

      onLocationClose();
    },
    [onFieldChange, onLocationClose, onMapLayersChange]
  );

  const onLocationClick = useCallback(() => {
    // The fullscreen map configuration overlay is hosted over the shared
    // editor map (see StoryMapForm/StoryMap). The session API lives in the
    // config actions context (always mounted above this form) — the trigger
    // can never hit a silent dead button.
    openMapConfig({
      location: config.titleTransition?.location,
      mapLayers: config.titleTransition?.mapLayers,
      dataLayerConfigId: config.titleTransition?.dataLayerConfigId,
      title: t('storyMap.form_title_location_dialog_title'),
      onConfirm: onLocationChangeWrapper,
    });
  }, [openMapConfig, config.titleTransition, t, onLocationChangeWrapper]);

  const onTitleBlur = useCallback(() => {
    const trimmedTitle = config.title.trim();
    if (trimmedTitle !== config.title) {
      onFieldChange('title')(trimmedTitle);
    }
  }, [config.title, onFieldChange]);

  return (
    <Box
      className="step active title"
      component="section"
      aria-label={t('storyMap.view_title_label', {
        title: config.title || t('storyMap.form_no_title_label'),
      })}
      sx={{ opacity: 0.99, pb: '35vh' }}
    >
      <Button
        variant="contained"
        startIcon={<GpsFixedIcon />}
        onClick={onLocationClick}
        sx={{ borderRadius: '0px', mb: 1, width: '100%' }}
      >
        {t('storyMap.form_title_location_button')}
      </Button>
      <Stack
        className="story-theme step-content"
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
