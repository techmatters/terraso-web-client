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

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { CollaborationContextProvider } from 'collaboration/collaborationContext';
import HelperText from 'common/components/HelperText';
import Map, { useMap } from 'gis/components/Map';
import { MapboxStyle } from 'gis/components/MapboxConstants';
import MapControls from 'gis/components/MapControls';
import MapGeocoder from 'gis/components/MapGeocoder';
import MapStyleSwitcher from 'gis/components/MapStyleSwitcher';
import { useStoryMapConfigContext } from 'storyMap/components/StoryMapForm/storyMapConfigContext';
import { StoryMapLayer } from 'storyMap/components/StoryMapLayer';
import {
  MapLayerConfig,
  Position,
  StoryMapConfig,
} from 'storyMap/storyMapTypes';

import { MapLayerDialog } from './MapLayerDialog';

const BearingIcon = () => {
  const { t } = useTranslation();
  return (
    <Paper
      alt={t('storyMap.form_location_helper_text_bearing_icon_alt')}
      variant="outlined"
      component="img"
      src="/storyMap/bearing-icon.svg"
      width={24}
      height={24}
      sx={{
        verticalAlign: 'middle',
      }}
    />
  );
};

const SetMapHelperText = () => {
  const { t } = useTranslation();
  return (
    <DialogContent>
      <Stack spacing={3}>
        <Box>
          <Trans i18nKey="storyMap.form_location_helper_text_step_1">
            <Typography gutterBottom variant="h3">
              Title
            </Typography>
            <Typography gutterBottom>Paragraph 1</Typography>
            <img
              src="/storyMap/set-map-step-1.png"
              alt={t('storyMap.form_location_helper_text_step_1_image_alt')}
            />
          </Trans>
        </Box>
        <Box>
          <Trans i18nKey="storyMap.form_location_helper_text_step_2">
            <Typography gutterBottom variant="h3">
              Title
            </Typography>
            <Typography gutterBottom sx={{ mb: 2 }}>
              Paragraph 1
            </Typography>
            <Typography gutterBottom>
              Content
              <BearingIcon />
              content
              <BearingIcon />
              content
            </Typography>
            <img
              src="/storyMap/set-map-step-2-1.png"
              alt={t('storyMap.form_location_helper_text_step_2_1_image_alt')}
            />
            <img
              src="/storyMap/set-map-step-2-2.png"
              alt={t('storyMap.form_location_helper_text_step_2_2_image_alt')}
            />
          </Trans>
        </Box>
        <Box>
          <Trans i18nKey="storyMap.form_location_helper_text_step_3">
            <Typography gutterBottom variant="h3">
              Title
            </Typography>
            <Typography gutterBottom>Paragraph 1</Typography>
            <img
              src={t('storyMap.form_location_helper_text_step_3_image_src')}
              alt={t('storyMap.form_location_helper_text_step_3_image_alt')}
            />
          </Trans>
        </Box>
      </Stack>
    </DialogContent>
  );
};

type MapLayerProps = {
  title: string;
  onConfirm: (mapLayerConfig: MapLayerConfig | null) => void;
  mapLayerConfig: MapLayerConfig | null;
};
const MapLayer = ({ title, onConfirm, mapLayerConfig }: MapLayerProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const onConfirmWrapper = useCallback(
    (mapLayerConfig: MapLayerConfig) => {
      onConfirm(mapLayerConfig);
      setOpen(false);
    },
    [onConfirm]
  );

  const onRemove = useCallback(() => {
    onConfirm(null);
  }, [onConfirm]);

  return (
    <>
      <Paper
        variant="outlined"
        sx={theme => ({
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          backgroundColor: 'gray.lite2',
          p: theme.spacing(1, 2, 1, 2),
          minHeight: '40px',
          display: 'flex',
          alignItems: 'center',
        })}
      >
        {mapLayerConfig ? (
          <>
            <Trans
              i18nKey="storyMap.form_location_add_data_layer_current"
              values={{ title: mapLayerConfig.title }}
            >
              prefix
              <Typography sx={{ fontWeight: 700, ml: 1 }}>title</Typography>
            </Trans>
            <IconButton onClick={onRemove}>
              <DeleteIcon sx={{ color: 'blue.dark3' }} />
            </IconButton>
          </>
        ) : (
          <Button
            variant="outlined"
            size="small"
            sx={{ color: 'blue.dark2', borderColor: 'blue.dark2' }}
            onClick={() => setOpen(true)}
          >
            {t('storyMap.form_location_add_data_layer_button')}
          </Button>
        )}
      </Paper>
      <MapLayerDialog
        title={title}
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirmWrapper}
      />
    </>
  );
};

type MapLocationChangeProps = {
  onPositionChange: (position: Position) => void;
};
const MapLocationChange = ({ onPositionChange }: MapLocationChangeProps) => {
  const { map } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }
    const updatePosition = () => {
      onPositionChange({
        center: map.getCenter(),
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
        bounds: map.getBounds(),
      });
    };
    map.on('load', updatePosition);
    map.on('move', updatePosition);

    return () => {
      map.off('load', updatePosition);
      map.off('move', updatePosition);
    };
  }, [map, onPositionChange]);

  return null;
};

type MapConfigurationDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (_: unknown) => void;
  location: Position;
  title: string;
  chapterId: string;
  mapLayerConfig: MapLayerConfig | null;
};
export const MapConfigurationDialog = (props: MapConfigurationDialogProps) => {
  const { t } = useTranslation();
  const { config } = useStoryMapConfigContext() as { config: StoryMapConfig };
  const { open, onClose, onConfirm, location, title, chapterId } = props;

  const [mapCenter, setMapCenter] = useState(location?.center);
  const [mapZoom, setMapZoom] = useState(location?.zoom);
  const [mapPitch, setMapPitch] = useState(location?.pitch);
  const [mapBearing, setMapBearing] = useState(location?.bearing);
  const [mapStyle, setMapStyle] = useState<string | undefined>();
  const [changeBounds, setChangeBounds] = useState(false);
  const [mapLayerConfig, setMapLayerConfig] = useState(props.mapLayerConfig);

  const mapRef = useRef(null);

  const initialLocation = useMemo(() => {
    if (location) {
      return location;
    }

    if (chapterId) {
      const currentIndex = config.chapters.findIndex(c => c.id === chapterId);
      const chapterWithLocation = config.chapters
        .slice(0, currentIndex + 1)
        .reverse()
        .find(c => c.location);

      if (chapterWithLocation) {
        return chapterWithLocation?.location;
      }
    }

    if (config.titleTransition?.location) {
      return config.titleTransition?.location;
    }

    const firstChapterWithLocation = config.chapters.find(
      chapter => chapter.location
    );
    return firstChapterWithLocation?.location;
  }, [location, config.chapters, config.titleTransition?.location, chapterId]);

  const handleConfirm = useCallback(() => {
    const location = _.omitBy(_.isNil, {
      center: mapCenter,
      zoom: mapZoom,
      pitch: mapPitch,
      bearing: mapBearing,
    });
    onConfirm({
      location,
      mapStyle: mapStyle || config.style,
      dataLayerConfig: mapLayerConfig,
    });
  }, [
    onConfirm,
    mapCenter,
    mapZoom,
    mapPitch,
    mapBearing,
    mapStyle,
    config.style,
    mapLayerConfig,
  ]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handlePositionChange = useCallback((position: Position) => {
    setMapCenter(position.center);
    setMapZoom(position.zoom);
    setMapPitch(position.pitch);
    setMapBearing(position.bearing);
  }, []);

  const onStyleChange = useCallback(
    ({ newStyle }: { newStyle: MapboxStyle }) => {
      setMapStyle(newStyle.data);
    },
    []
  );

  const onAddMapLayer = useCallback((mapLayerConfig: MapLayerConfig | null) => {
    setChangeBounds(true);
    setMapLayerConfig(mapLayerConfig);
  }, []);

  return (
    <CollaborationContextProvider owner={config} entityType="story_map">
      <Dialog
        fullScreen
        open={open}
        onClose={handleCancel}
        aria-labelledby="map-location-dialog-title"
        aria-describedby="map-location-dialog-content-text"
      >
        <Stack direction="row" justifyContent="space-between">
          <Stack>
            <DialogTitle
              component="h1"
              id="map-location-dialog-title"
              sx={{ pb: 0 }}
            >
              {title ? (
                <Trans
                  i18nKey="storyMap.form_location_dialog_title"
                  values={{ title: title }}
                >
                  prefix
                  <i>italic</i>
                </Trans>
              ) : (
                <>{t('storyMap.form_location_dialog_title_blank')}</>
              )}
            </DialogTitle>
            <DialogContent sx={{ pb: 0 }}>
              <HelperText
                showLabel
                maxWidth={586}
                label={t('storyMap.form_location_dialog_helper_text_label')}
                Component={SetMapHelperText}
                buttonProps={{
                  sx: { pl: 0, color: 'gray.dark1' },
                }}
              />
            </DialogContent>
          </Stack>
          <DialogActions sx={{ pr: 3 }}>
            <Button size="small" onClick={handleCancel}>
              {t('storyMap.location_dialog_cancel_button')}
            </Button>
            <Button size="small" onClick={handleConfirm} variant="contained">
              {t('storyMap.location_dialog_confirm_button')}
            </Button>
          </DialogActions>
        </Stack>

        <DialogContent>
          <MapLayer
            title={title}
            mapLayerConfig={mapLayerConfig}
            onConfirm={onAddMapLayer}
          />
          <Map
            ref={mapRef}
            use3dTerrain
            height="100%"
            initialLocation={initialLocation}
            projection={config.projection}
            mapStyle={config.style}
          >
            <MapControls showCompass visualizePitch />
            <MapGeocoder position="top-right" />
            <MapStyleSwitcher
              position="top-right"
              onStyleChange={onStyleChange}
            />
            <MapLocationChange onPositionChange={handlePositionChange} />
            {mapLayerConfig && (
              <StoryMapLayer
                config={mapLayerConfig}
                useConfigBounds={true}
                changeBounds={changeBounds}
              />
            )}
          </Map>
        </DialogContent>
      </Dialog>
    </CollaborationContextProvider>
  );
};
