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

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import logger from 'terraso-client-shared/monitoring/logger';
import { Box } from '@mui/material';

import { isValidBounds } from 'terraso-web-client/gis/gisUtils';
import mapboxgl from 'terraso-web-client/gis/mapbox';

import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_PROJECTION_DEFAULT,
  MAPBOX_STYLE_DEFAULT,
} from 'terraso-web-client/config';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const TERRAIN_EXAGGERATION = 1;

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

const TRANSLATABLE_LAYERS = [
  'country-label',
  'continent-label',
  'state-label',
  'settlement-label',
  'settlement-subdivision-label',
  'airport-label',
  'poi-label',
  'water-point-label',
  'water-line-label',
  'natural-point-label',
  'natural-line-label',
  'waterway-label',
];

const MapContext = createContext();

export const useMap = () => useContext(MapContext);

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
//
// The images/sources/layers registry is resolved at MERGE time through
// `getRegistry` (never captured in a closure): on the shared editor map the
// layers can mount/unmount while the style fetch is in flight (the map
// configuration overlay's draft layers), and merging a stale snapshot
// resurrects deleted layers and wipes freshly mounted ones. With merge-time
// resolution both fetch orderings heal.
async function switchStyle(map, style, getRegistry, language) {
  const newStyle = await fetchStyle(style);

  const { images, sources, layers } = getRegistry();

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
    localizeLayers(map, language);
  });
}

const localizeLayers = (map, language) => {
  TRANSLATABLE_LAYERS.forEach(layer => {
    try {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'text-field', ['get', `name_${language}`]);
      }
    } catch (error) {
      console.warn('Error setting layer text field', error);
    }
  });
};

export const MapContextConsumer = props => <MapContext.Consumer {...props} />;

export const MapProvider = props => {
  const { i18n } = useTranslation();
  const language = i18n.language.split('-')[0];
  const { children, onStyleChange } = props;
  const [map, setMap] = useState(null);
  const [mapDimensions, setMapDimensions] = useState(undefined);
  // The style-merge registry lives in refs, not state: nothing renders from
  // it, and switchStyle must observe it at merge time (see switchStyle).
  const imagesRef = useRef({});
  const sourcesRef = useRef({});
  const layersRef = useRef({});

  const addImage = useCallback(
    (name, image) => {
      if (!map) {
        return;
      }
      imagesRef.current = { ...imagesRef.current, [name]: image };
      map.addImage(name, image);
    },
    [map]
  );

  const removeImage = useCallback(
    name => {
      if (!map) {
        return;
      }
      imagesRef.current = _.omit(name, imagesRef.current);
      map.removeImage(name);
    },
    [map]
  );

  const addSource = useCallback(
    (name, source) => {
      if (!map) {
        return;
      }
      let currentSource;

      try {
        currentSource = map.getSource(name);
      } catch (error) {
        console.log('Error getting source', error);
      }

      try {
        const isGeoJson = source.type === 'geojson';
        if (isGeoJson && currentSource) {
          currentSource.setData(source.data);
          sourcesRef.current = { ...sourcesRef.current, [name]: source };
          return;
        }

        if (currentSource) {
          map.removeSource(name);
        }

        map.addSource(name, source);
        sourcesRef.current = { ...sourcesRef.current, [name]: source };
      } catch (error) {
        logger.warn('Error adding source', error);
      }
    },
    [map]
  );

  const removeSource = useCallback(
    sourceName => {
      if (!map) {
        return;
      }
      try {
        map.removeSource(sourceName);
        sourcesRef.current = _.omit(sourceName, sourcesRef.current);
      } catch (error) {
        logger.error(`Error removing source {$sourceName}`, error);
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
        layersRef.current = { ...layersRef.current, [layer.id]: layer };
      } catch (error) {
        logger.warn('Error adding layer', error);
      }
    },
    [map]
  );

  const removeLayer = useCallback(
    layerId => {
      if (!map?.getStyle()) {
        return;
      }

      try {
        map?.removeLayer(layerId);
        layersRef.current = _.omit(layerId, layersRef.current);
      } catch (error) {
        logger.error(`Error removing layer ${layerId}`, error);
      }
    },
    [map]
  );

  const changeStyle = useCallback(
    newStyle => {
      switchStyle(
        map,
        newStyle,
        () => ({
          images: imagesRef.current,
          sources: sourcesRef.current,
          layers: layersRef.current,
        }),
        language
      );
      onStyleChange?.(newStyle);
    },
    [map, onStyleChange, language]
  );

  return (
    <MapContext.Provider
      value={{
        setMap,
        map,
        setMapDimensions,
        mapDimensions,
        changeStyle,
        addImage,
        removeImage,
        addSource,
        removeSource,
        addLayer,
        removeLayer,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

const Map = forwardRef((props, ref) => {
  const {
    id,
    mapStyle,
    projection,
    initialLocation: propsInitialLocation,
    interactive = true,
    disableRotation = false,
    disablePitch = true,
    hash = false,
    attributionControl = true,
    center,
    initialBounds,
    zoom = 1,
    height = '400px',
    width = '100%',
    sx,
    onBoundsChange,
    disableElevation = false,
    padding,
    children,
  } = props;
  const { i18n } = useTranslation();
  const { map, setMap, setMapDimensions } = useMap();
  const mapContainer = useRef(null);
  const [bounds] = useState(initialBounds);
  const [initialLocation] = useState(propsInitialLocation);

  // KNOWN QUIRK (documented, intentionally left): `mapStyle` is in this
  // effect's dependency list, so a mapStyle PROP change tears the mapbox Map
  // down and recreates it (all controls/layers re-attach). In-place style
  // switches go through `changeStyle`/switchStyle instead (see
  // MapStyleSwitcher) — the map config overlay's confirmed basemap reaches
  // this path only via the config write. Switching this effect to switchStyle
  // is NOT contained: the recreation also re-applies projection/bounds/center
  // and would need its own equivalence tests on the shared editor map.
  useEffect(() => {
    const validBounds = isValidBounds(bounds);

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle || MAPBOX_STYLE_DEFAULT,
      projection: projection || MAPBOX_PROJECTION_DEFAULT,
      zoom,
      center,
      hash,
      attributionControl,
      preserveDrawingBuffer: true,
      bounds: validBounds ? bounds : undefined,
      ...(initialLocation ? initialLocation : {}),
    });

    if (ref) {
      ref.current = map;
    }

    if (padding) {
      map.setPadding(padding);
    }

    map.on('load', function () {
      if (!disableElevation && !map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', MAPBOX_DEM_SOURCE);

        // add the DEM (Digital Elevation Model) source as a terrain layer with exaggerated height
        map.setTerrain({
          source: 'mapbox-dem',
          exaggeration: TERRAIN_EXAGGERATION,
        });
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

    return () => {
      map.remove();
    };
  }, [
    mapStyle,
    initialLocation,
    projection,
    hash,
    center,
    zoom,
    attributionControl,
    setMap,
    bounds,
    disableElevation,
    padding,
    ref,
  ]);

  useEffect(() => {
    if (!map) {
      return;
    }

    if (!interactive) {
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.dragRotate.disable();
      map.dragPan.disable();
      map.keyboard.disable();
      map.keyboard.disableRotation();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.touchPitch.disable();
      return;
    }

    map.touchPitch.enable();
    map.touchZoomRotate.enable();
    map.touchZoomRotate.enableRotation();
    map.dragPan.enable();
    map.dragRotate.enable();
    map.doubleClickZoom.enable();
    map.scrollZoom.enable();
    // Exactly mirrors the disable branch above (keyboard + boxZoom included):
    // the fullscreen surface must be as keyboard-capable as the dialog it
    // replaced.
    map.boxZoom.enable();
    map.keyboard.enable();
    map.keyboard.enableRotation();

    if (disableRotation) {
      // disable map rotation using right click + drag
      map.dragRotate.disable();

      // disable map rotation using touch rotation gesture
      map.touchZoomRotate.disableRotation();
    }

    if (disablePitch) {
      map.touchPitch.disable();
    }
  }, [map, interactive, disableRotation, disablePitch]);

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
    if (!map || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      map.resize();
      if (entry.contentBoxSize && entry.contentBoxSize[0]) {
        setMapDimensions({
          height: entry.contentBoxSize[0].blockSize,
          width: entry.contentBoxSize[0].inlineSize,
        });
      }
    });

    observer.observe(map.getContainer());

    return () => {
      observer.disconnect();
    };
  }, [map, setMapDimensions]);

  useEffect(() => {
    if (!map) {
      return;
    }
    const language = i18n.language.split('-')[0];

    localizeLayers(map, language);
  }, [map, i18n.language]);

  return (
    <Box
      id={id}
      ref={mapContainer}
      sx={[
        {
          width,
          height,
          pointerEvents: interactive ? 'auto' : 'none',
        },
        sx,
      ]}
    >
      {children}
    </Box>
  );
});

/**
 * @type {React.ForwardRefExoticComponent<React.PropsWithChildren<any>>}
 */
const WrappedMap = forwardRef((props, ref) => {
  return (
    <MapProvider {...props}>
      <Map ref={ref} {...props} />
    </MapProvider>
  );
});

export default WrappedMap;
