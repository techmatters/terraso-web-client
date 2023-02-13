import React, { useCallback, useEffect, useMemo, useState } from 'react';

// eslint-disable-next-line import/no-webpack-loader-syntax
import mapboxgl from '!mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';

import { MAPBOX_ACCESS_TOKEN, MAPBOX_STYLE_DEFAULT } from 'config';

import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import _ from 'lodash/fp';

import { useConfigContext } from './configContext';

const MapLocationDialog = props => {
  const { t } = useTranslation();
  const { config } = useConfigContext();
  const { open, onClose, onConfirm, chapter } = props;
  const { location, title } = chapter;

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
    const currentIndex = config.chapters.findIndex(c => c.id === chapter.id);
    const chapterWithLocation = _.flow(
      _.take(currentIndex),
      _.reverse,
      _.find(c => c.location)
    )(config.chapters);

    if (chapterWithLocation) {
      return chapterWithLocation?.location;
    }

    const firstChapterWithLocation = config.chapters.find(
      chapter => chapter.location
    );
    return firstChapterWithLocation?.location;
  }, [location, config.chapters, chapter.id]);

  useEffect(() => {
    const headerHeight =
      document.getElementById('header-container').clientHeight;
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
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      // add the DEM source as a terrain layer with exaggerated height
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // add a sky layer that will show when the map is highly pitched
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      });
    });

    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(169, 169, 188)', // Lower atmosphere
        'high-color': 'rgb(16, 16, 20)', // Upper atmosphere
        'horizon-blend': 0.02, // Atmosphere thickness (default 0.2 at low zooms)
        'space-color': 'rgb(20, 20, 26)', // Background color
        'star-intensity': 0.1, // Background star brightness (default 0.35 at low zoooms )
      });
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
      <DialogTitle component="h1" id="map-location-dialog-title">
        {t('storyMap.form_location_dialog_title', { title })}
      </DialogTitle>
      <DialogContent>
        <Box ref={setMapContainer} sx={{ height: '100%', width: '100%' }} />
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: 'flex-end',
          padding: '20px',
        }}
      >
        <Button onClick={handleCancel}>
          {t('storyMap.location_dialog_cancel_button')}
        </Button>
        <Button onClick={handleConfirm} variant="contained">
          {t('storyMap.location_dialog_confirm_button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MapLocationDialog;
