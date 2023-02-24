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

import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';

import mapboxgl from 'gis/mapbox';

import { MAPBOX_ACCESS_TOKEN, MAPBOX_STYLE_DEFAULT } from 'config';

import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import _ from 'lodash/fp';

import {
  MAPBOX_DEM_SOURCE,
  MAPBOX_FOG,
  MAPBOX_SKY_LAYER,
} from 'storyMap/storyMapConstants';

import { useStoryMapConfigContext } from './storyMapConfigContext';

const MapLocationDialog = props => {
  const { t } = useTranslation();
  const { config } = useStoryMapConfigContext();
  const { open, onClose, onConfirm, location, title, chapterId } = props;

  const [mapContainer, setMapContainer] = useState();
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

  useEffect(() => {
    if (!mapContainer) {
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainer,
      style: config.style || MAPBOX_STYLE_DEFAULT,
      projection: config.projection || 'globe',
      zoom: 1,
      ...(initialLocation || {}),
    });

    const updatePosition = () => {
      setMapCenter(map.getCenter());
      setMapZoom(map.getZoom());
      setMapPitch(map.getPitch());
      setMapBearing(map.getBearing());
    };

    map.addControl(
      new MapboxGeocoder({
        accessToken: MAPBOX_ACCESS_TOKEN,
        mapboxgl,
      })
    );

    map.addControl(new mapboxgl.NavigationControl());

    map.on('load', function () {
      updatePosition();
      map.addSource('mapbox-dem', MAPBOX_DEM_SOURCE);
      // add the DEM source as a terrain layer with exaggerated height
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // add a sky layer that will show when the map is highly pitched
      map.addLayer(MAPBOX_SKY_LAYER);
    });

    map.on('style.load', () => {
      map.setFog(MAPBOX_FOG);
    });

    // Handle map move events
    map.on('move', function () {
      updatePosition();
    });

    return () => {
      map.remove();
    };
  }, [mapContainer, initialLocation, config.style, config.projection]);

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
          {t('storyMap.form_location_dialog_title', { title })}
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
        <Box ref={setMapContainer} sx={{ height: '100%', width: '100%' }} />
      </DialogContent>
    </Dialog>
  );
};

export default MapLocationDialog;
