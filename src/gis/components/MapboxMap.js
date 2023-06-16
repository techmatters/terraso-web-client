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
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import _ from 'lodash/fp';
import { Box } from '@mui/material';
import mapboxgl from 'gis/mapbox';
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_PROJECTION_DEFAULT,
  MAPBOX_STYLE_DEFAULT,
} from 'config';
import { withWrapper } from 'react-hoc';

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

const MapContext = React.createContext();

export const useMap = () => React.useContext(MapContext);

// Extract style from Style options
// Options:
// 1. "mapbox://styles/mapbox/satellite-v9"
// 2. "mapbox/satellite-v9"
// 3. "https://api.mapbox.com/styles/v1/mapbox/satellite-v9""
// 4. Object
// Return style object
const extractStyle = async style => {
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
  return await response.json();
};

// Set Style doesn't keep the current layers, so we need to copy them across
// Issue: https://github.com/mapbox/mapbox-gl-js/issues/4006
async function switchStyle(map, style, images, sources, layers) {
  const newStyle = await extractStyle(style);

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

export const MapProvider = props => {
  const { children, onStyleChange } = props;
  const [map, setMap] = useState(null);
  const [images, setImages] = useState({});
  const [sources, setSources] = useState({});
  const [layers, setLayers] = useState({});

  const mapWrapper = useMemo(() => {
    if (!map) {
      return map;
    }
    const originalAddImage = map.addImage.bind(map);
    map.addImage = function (name, image) {
      setImages(prev => ({ ...prev, [name]: image }));
      originalAddImage(name, image);
    };

    const originalAddSource = map.addSource.bind(map);
    map.addSource = function (name, source) {
      setSources(prev => ({ ...prev, [name]: source }));
      originalAddSource(name, source);
    };

    const originalAddLayer = map.addLayer.bind(map);
    map.addLayer = function (layer, before) {
      setLayers(prev => ({ ...prev, [layer.id]: layer }));
      originalAddLayer(layer, before);
    };

    return map;
  }, [map]);

  const changeStyle = useCallback(
    newStyle => {
      switchStyle(map, newStyle, images, sources, layers);
      onStyleChange?.(newStyle);
    },
    [map, images, sources, layers, onStyleChange]
  );

  return (
    <MapContext.Provider value={{ setMap, map: mapWrapper, changeStyle }}>
      {children}
    </MapContext.Provider>
  );
};

const MapboxMap = props => {
  const {
    id,
    style,
    projection,
    initialLocation,
    interactive = true,
    hash = false,
    attributionControl = true,
    center,
    zoom = 1,
    height = '400px',
    width = '100%',
    sx,
    onBoundsChange,
    children,
  } = props;
  const { map, setMap } = useMap();
  const mapContainer = useRef(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: style || MAPBOX_STYLE_DEFAULT,
      interactive,
      projection: projection || MAPBOX_PROJECTION_DEFAULT,
      zoom,
      center,
      hash,
      attributionControl,
      ...(initialLocation ? initialLocation : {}),
    });

    map.on('load', function () {
      map.addSource('mapbox-dem', MAPBOX_DEM_SOURCE);

      // add the DEM (Digital Elevation Model) source as a terrain layer with exaggerated height
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // add a sky layer that will show when the map is highly pitched
      map.addLayer(MAPBOX_SKY_LAYER);

      setMap(map);
    });

    map.on('style.load', () => {
      map.setFog(MAPBOX_FOG);
    });

    return () => {
      map.remove();
    };
  }, [
    style,
    initialLocation,
    projection,
    interactive,
    hash,
    center,
    zoom,
    attributionControl,
    setMap,
  ]);

  useEffect(() => {
    if (!map) {
      return;
    }
    const onMoveListener = () => onBoundsChange?.(map.getBounds());
    map.on('moveend', onMoveListener);

    return () => {
      map.on('moveend', onMoveListener);
    };
  }, [map, onBoundsChange]);

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
      {typeof children === 'function' ? children(map) : children}
    </Box>
  );
};

export default withWrapper(MapboxMap, MapProvider);
