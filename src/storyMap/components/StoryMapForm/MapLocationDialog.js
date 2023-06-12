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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import MapboxGeocoder from 'gis/components/MapboxGeocoder';
import MapboxMap, { useMap } from 'gis/components/MapboxMap';
import MapboxMapControls from 'gis/components/MapboxMapControls';
import { useStoryMapConfigContext } from './storyMapConfigContext';

const MapLocationChange = props => {
  const { onPositionChange } = props;
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

const MapLocationDialog = props => {
  const { t } = useTranslation();
  const { config } = useStoryMapConfigContext();
  const { open, onClose, onConfirm, location, title, chapterId } = props;

  const [mapCenter, setMapCenter] = useState(location?.center);
  const [mapZoom, setMapZoom] = useState(location?.zoom);
  const [mapPitch, setMapPitch] = useState(location?.pitch);
  const [mapBearing, setMapBearing] = useState(location?.bearing);
  const [marginTop, setMarginTop] = useState(0);

  const initialLocation = useMemo(() => {
    if (location) {
      return location;
    }

    if (chapterId) {
      const currentIndex = config.chapters.findIndex(c => c.id === chapterId);
      const chapterWithLocation = _.flow(
        _.take(currentIndex),
        _.reverse,
        _.find(c => c.location)
      )(config.chapters);

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

  useEffect(() => {
    const headerHeight =
      document.getElementById('header-container')?.clientHeight;
    setMarginTop(headerHeight);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm({
      center: mapCenter,
      zoom: mapZoom,
      pitch: mapPitch,
      bearing: mapBearing,
    });
  }, [onConfirm, mapCenter, mapZoom, mapPitch, mapBearing]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handlePositionChange = useCallback(position => {
    setMapCenter(position.center);
    setMapZoom(position.zoom);
    setMapPitch(position.pitch);
    setMapBearing(position.bearing);
  }, []);

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleCancel}
      aria-labelledby="map-location-dialog-title"
      aria-describedby="map-location-dialog-content-text"
      sx={{ mt: `${marginTop}px` }}
    >
      <Stack direction="row" justifyContent="space-between">
        <DialogTitle component="h1" id="map-location-dialog-title">
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
        <MapboxMap
          use3dTerrain
          height="100%"
          initialLocation={initialLocation}
          projection={config.projection}
          style={config.style}
        >
          <MapboxMapControls showCompass visualizePitch />
          <MapboxGeocoder />
          <MapLocationChange onPositionChange={handlePositionChange} />
        </MapboxMap>
      </DialogContent>
    </Dialog>
  );
};

export default MapLocationDialog;
