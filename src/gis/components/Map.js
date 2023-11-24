/*
 * Copyright © 2023 Technology Matters
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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import logger from 'terraso-client-shared/monitoring/logger';
import { Box } from '@mui/material';

import { withWrapper } from 'react-hoc';

import { isValidBounds } from 'gis/gisUtils';
import mapboxgl from 'gis/mapbox';

import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_PROJECTION_DEFAULT,
  MAPBOX_STYLE_DEFAULT,
} from 'config';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

export const MAPBOX_DEM_SOURCE = {
  type: 'raster-dem',
  url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
  tileSize: 512,
  maxzoom: 14,
};

export const MAPBOX_SKY_LAYER = {
  id: 'sky',
  type: 'sky',
  paint: {
    'sky-type': 'atmosphere',
    'sky-atmosphere-sun': [0.0, 0.0],
    'sky-atmosphere-sun-intensity': 15,
  },
};

export const MAPBOX_FOG = {
  color: 'rgb(169, 169, 188)', // Lower atmosphere
  'high-color': 'rgb(16, 16, 20)', // Upper atmosphere
  'horizon-blend': 0.02, // Atmosphere thickness (default 0.2 at low zooms)
  'space-color': 'rgb(20, 20, 26)', // Background color
  'star-intensity': 0.1, // Background star brightness (default 0.35 at low zoooms )
};

const TRANSLATABLE_LAYERS = ['country-label', 'continent-label'];

const MapContext = React.createContext();

export const useMap = () => React.useContext(MapContext);

// Extract style from Style options
// Options:
// 1. "mapbox://styles/mapbox/satellite-v9"
// 2. "mapbox/satellite-v9"
// 3. "https://api.mapbox.com/styles/v1/mapbox/satellite-v9""
// 4. Object
// Return style object
export const fetchStyle = async style => {
  if (typeof style === 'object') {
    return style;
  }

  const getStyleId = () => {
    if (style.startsWith('mapbox/')) {
      return style;
    }
    if (style.startsWith('mapbox://styles/')) {
      return style.replace('mapbox://styles/', '');
    }
    if (style.startsWith('https://api.mapbox.com/styles/v1/')) {
      return style.replace('https://api.mapbox.com/styles/v1/', '');
    }
    return null;
  };

  const url = `https://api.mapbox.com/styles/v1/${getStyleId()}?access_token=${MAPBOX_ACCESS_TOKEN}`;
  const response = await fetch(url);
  const json = await response.json();
  return json;
};

// Set Style doesn't keep the current layers, so we need to copy them across
// Issue: https://github.com/mapbox/mapbox-gl-js/issues/4006
async function switchStyle(map, style, images, sources, layers) {
  const newStyle = await fetchStyle(style);

  const mergedSources = {
    ...newStyle.sources,
    ...sources,
  };

  const mergedLayers = Object.values({
    ..._.keyBy('id', newStyle.layers),
    ...layers,
  });

  map.setStyle(
    {
      ...newStyle,
      sources: mergedSources,
      layers: mergedLayers,
    },
    {
      diff: false,
    }
  );
  map.once('styledata', () => {
    Object.entries(images).forEach(([name, image]) => {
      if (map.hasImage(name)) {
        return;
      }
      map.addImage(name, image);
    });
  });
}

export const MapContextConsumer = props => <MapContext.Consumer {...props} />;

export const MapProvider = props => {
  const { children, onStyleChange } = props;
  const [map, setMap] = useState(null);
  const [images, setImages] = useState({});
  const [sources, setSources] = useState({});
  const [layers, setLayers] = useState({});

  const addImage = useCallback(
    (name, image) => {
      if (!map) {
        return;
      }
      setImages(prev => ({ ...prev, [name]: image }));
      map.addImage(name, image);
    },
    [map]
  );

  const addSource = useCallback(
    (name, source) => {
      if (!map) {
        return;
      }

      const currentSource = map.getSource(name);

      try {
        const isGeoJson = source.type === 'geojson';
        if (isGeoJson && currentSource) {
          currentSource.setData(source.data);
          setSources(prev => ({ ...prev, [name]: source }));
          return;
        }

        if (currentSource) {
          map.removeSource(name);
        }

        map.addSource(name, source);
        setSources(prev => ({ ...prev, [name]: source }));
      } catch (error) {
        logger.warn('Error adding source', error);
      }
    },
    [map]
  );

  const addLayer = useCallback(
    (layer, before) => {
      if (!map) {
        return;
      }
      try {
        map.addLayer(layer, before);
        setLayers(prev => ({ ...prev, [layer.id]: layer }));
      } catch (error) {
        logger.warn('Error adding layer', error);
      }
    },
    [map]
  );

  const changeStyle = useCallback(
    newStyle => {
      switchStyle(map, newStyle, images, sources, layers);
      onStyleChange?.(newStyle);
    },
    [map, images, sources, layers, onStyleChange]
  );

  return (
    <MapContext.Provider
      value={{
        setMap,
        map,
        changeStyle,
        addImage,
        addSource,
        addLayer,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

const Map = props => {
  const {
    id,
    mapStyle,
    projection,
    initialLocation,
    interactive = true,
    hash = false,
    attributionControl = true,
    center,
    initialBounds,
    zoom = 1,
    disableRotation = false,
    height = '400px',
    width = '100%',
    sx,
    onBoundsChange,
    disableElevation = false,
    children,
  } = props;
  const { i18n } = useTranslation();
  const { map, setMap } = useMap();
  const mapContainer = useRef(null);
  const [bounds] = useState(initialBounds);

  useEffect(() => {
    const validBounds = isValidBounds(bounds);

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle || MAPBOX_STYLE_DEFAULT,
      interactive,
      projection: projection || MAPBOX_PROJECTION_DEFAULT,
      zoom,
      center,
      hash,
      attributionControl,
      preserveDrawingBuffer: true,
      bounds: validBounds ? bounds : undefined,
      ...(initialLocation ? initialLocation : {}),
    });

    map.on('load', function () {
      if (!disableElevation && !map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', MAPBOX_DEM_SOURCE);

        // add the DEM (Digital Elevation Model) source as a terrain layer with exaggerated height
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      }

      if (disableElevation) {
        map.setTerrain();
      }

      if (!map.getLayer('sky')) {
        // add a sky layer that will show when the map is highly pitched
        map.addLayer(MAPBOX_SKY_LAYER);
      }

      setMap(map);
    });

    map.on('style.load', () => {
      map.setFog(MAPBOX_FOG);
    });

    if (disableRotation) {
      // disable map rotation using right click + drag
      map.dragRotate.disable();

      // disable map rotation using touch rotation gesture
      map.touchZoomRotate.disableRotation();
    }

    return () => {
      map.remove();
    };
  }, [
    mapStyle,
    initialLocation,
    projection,
    interactive,
    hash,
    center,
    zoom,
    attributionControl,
    setMap,
    disableRotation,
    bounds,
    disableElevation,
  ]);

  useEffect(() => {
    if (!map) {
      return;
    }
    const onMoveListener = () => {
      const bounds = map.getBounds();
      onBoundsChange?.(bounds);
    };
    map.on('moveend', onMoveListener);

    return () => {
      map.off('moveend', onMoveListener);
    };
  }, [map, onBoundsChange]);

  useEffect(() => {
    if (!map) {
      return;
    }
    const language = i18n.language.split('-')[0];

    TRANSLATABLE_LAYERS.forEach(layer => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'text-field', ['get', `name_${language}`]);
      }
    });
  }, [map, i18n.language]);

  return (
    <Box
      id={id}
      ref={mapContainer}
      sx={{
        width,
        height,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default withWrapper(Map, MapProvider);
