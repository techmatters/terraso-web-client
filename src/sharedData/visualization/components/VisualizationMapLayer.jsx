/*
 * Copyright © 2024 Technology Matters
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import bbox from '@turf/bbox';
import _ from 'lodash/fp';
import logger from 'terraso-client-shared/monitoring/logger';
import { Box, Portal, Stack, Typography } from '@mui/material';

import Layer from 'terraso-web-client/gis/components/Layer';
import { useMap } from 'terraso-web-client/gis/components/Map';
import mapboxgl from 'terraso-web-client/gis/mapbox';
import { toWorldShape } from 'terraso-web-client/gis/mercator';
import { getLayerImage } from 'terraso-web-client/sharedData/visualization/visualizationMarkers';

const DEFAULT_MARKER_OPACITY = 1;

export const LAYER_TYPES = {
  MARKERS: 'markers',
  POLYGONS_OUTLINE: 'polygons-outline',
  POLYGONS_FILL: 'polygons-fill',
};

export const generateLayerId = (layerId, layerType) => {
  return `${layerId}-${layerType}`;
};

// Opacity range between 0 - 100
export const getLayerOpacity = (type, visualizationConfig) => {
  if (type !== 'polygons-fill') {
    return DEFAULT_MARKER_OPACITY;
  }
  const opacity =
    visualizationConfig?.visualizeConfig?.opacity || DEFAULT_MARKER_OPACITY;
  return opacity / 100;
};

// Keep the geometry pass bounded for very large layers; bounds still use all
// features, only the framing search is sampled.
const MAX_SUMMARY_SHAPES = 20000;

const waitForSource = (map, sourceId) =>
  new Promise(resolve => {
    const finish = source => {
      map.off('sourcedata', onSourceData);
      map.off('remove', onRemove);
      resolve(source);
    };
    const onSourceData = () => {
      const source = map.getSource(sourceId);
      if (source?.loaded()) {
        finish(source);
      }
    };
    const onRemove = () => finish(null);
    map.on('sourcedata', onSourceData);
    map.on('remove', onRemove);
    onSourceData();
  });

const readSourceData = async source => {
  let sourceData = source._data;

  if (typeof sourceData === 'string') {
    try {
      const response = await fetch(sourceData);
      sourceData = await response.json();
    } catch {
      return null;
    }
  }

  return sourceData && typeof sourceData === 'object' ? sourceData : null;
};

const summarizeGeoJson = geoJson => {
  const features = Array.isArray(geoJson.features)
    ? geoJson.features
    : [geoJson];
  const stride = Math.max(1, Math.ceil(features.length / MAX_SUMMARY_SHAPES));
  const shapes = [];
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  features.forEach((feature, index) => {
    let calculatedBbox;
    try {
      calculatedBbox = bbox(feature);
    } catch {
      return;
    }
    if (!calculatedBbox || !calculatedBbox.every(Number.isFinite)) {
      return;
    }

    west = Math.min(west, calculatedBbox[0]);
    south = Math.min(south, calculatedBbox[1]);
    east = Math.max(east, calculatedBbox[2]);
    north = Math.max(north, calculatedBbox[3]);

    if (index % stride === 0) {
      const shape = toWorldShape(calculatedBbox);
      if (shape) {
        shapes.push(shape);
      }
    }
  });

  if (!Number.isFinite(west)) {
    return null;
  }

  return {
    bounds: new mapboxgl.LngLatBounds([west, south], [east, north]),
    shapes,
  };
};

const getSourceSummary = async (map, sourceId) => {
  const source = map.getSource(sourceId);
  if (!source) {
    return null;
  }

  const loadedSource = source.loaded()
    ? source
    : await waitForSource(map, sourceId);
  if (!loadedSource) {
    return null;
  }

  // Remote/tileset sources only expose bounds, there are no features to weigh
  if (loadedSource.bounds) {
    return {
      bounds: new mapboxgl.LngLatBounds(loadedSource.bounds),
      shapes: null,
    };
  }

  const sourceData = await readSourceData(loadedSource);
  return sourceData ? summarizeGeoJson(sourceData) : null;
};

const parseMarkerPopupJsonFields = content => {
  try {
    return JSON.parse(content);
  } catch (error) {
    logger.error('Failed to marker defined fields JSON content', error);
  }
  return [];
};

const MarkerPopupContent = props => {
  const { data } = props;
  const fields = parseMarkerPopupJsonFields(data.fields);
  const title = data.title;

  return (
    <Box sx={{ p: 1 }}>
      {title && (
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={{ fontSize: '1rem' }}
        >
          {title}
        </Typography>
      )}
      <Stack spacing={1}>
        {fields.map((field, index) => (
          <Stack key={index} direction="row" spacing={1}>
            <Typography sx={{ fontSize: '0.8rem' }}>
              {field.label}: {_.toString(field.value)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

const MapboxLayer = props => {
  const {
    sourceName,
    visualizationConfig,
    showInitialPopup,
    showPopups = true,
    useConfigBounds,
    changeBounds = true,
    useTileset,
    isMapFile,
    opacity: initialOpacity,
    getFraming,
    onLayerAdded,
  } = props;
  const { map } = useMap();
  const [imageSvg, setimageSvg] = useState();
  const [popupData, setPopupData] = useState(null);
  const popupContainer = useMemo(() => document.createElement('div'), []);

  const getOpacity = useCallback(
    fallback => (_.isNil(initialOpacity) ? fallback : initialOpacity),
    [initialOpacity]
  );

  const useSvg = useMemo(
    () => visualizationConfig?.visualizeConfig?.shape !== 'circle',
    [visualizationConfig?.visualizeConfig]
  );

  const popup = useMemo(
    () =>
      isMapFile
        ? null
        : new mapboxgl.Popup({
            className: `${sourceName}-marker-popup`,
          }).setDOMContent(popupContainer),
    [popupContainer, isMapFile, sourceName]
  );

  useEffect(() => {
    if (!visualizationConfig?.visualizeConfig) {
      return;
    }
    getLayerImage({
      ...(visualizationConfig?.visualizeConfig || {}),
      opacity: DEFAULT_MARKER_OPACITY,
    }).then(image => {
      return setimageSvg(image);
    });
  }, [visualizationConfig?.visualizeConfig]);

  const openPopup = useCallback(
    (feature, event) => {
      if (!feature || isMapFile) {
        return;
      }
      const coordinates = feature.geometry.coordinates;

      if (event) {
        // Ensure that if the map is zoomed out such that
        // multiple copies of the feature are visible, the
        // popup appears over the copy being pointed to.
        while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
        }
      }

      setPopupData({
        coordinates,
        data: feature.properties,
      });
    },
    [isMapFile]
  );

  useEffect(() => {
    if (!map || !popupData?.coordinates || isMapFile) {
      return;
    }
    popup.setLngLat(popupData?.coordinates);
    if (!popup.isOpen()) {
      popup.addTo(map);
    }
  }, [popup, popupData?.coordinates, map, isMapFile]);

  useEffect(() => {
    if (!showInitialPopup || !map) {
      return;
    }
    const source = map.getSource(sourceName);
    if (!source) {
      return;
    }
    const features = source?._data?.features;
    if (_.isEmpty(features)) {
      return;
    }
    openPopup(features[0]);
  }, [
    showInitialPopup,
    openPopup,
    map,
    visualizationConfig?.annotateConfig?.annotationTitle,
    visualizationConfig?.annotateConfig?.dataPoints,
    sourceName,
  ]);

  useEffect(() => {
    if (!map || !changeBounds) {
      return;
    }

    let cancelled = false;
    let summaryPromise = null;
    const loadSummary = () =>
      (summaryPromise ??= getSourceSummary(map, sourceName));

    const getConfigBounds = () => {
      const viewportBounds = visualizationConfig?.viewportConfig?.bounds;
      if (!viewportBounds) {
        return;
      }
      const southWest = viewportBounds.southWest;
      const northEast = viewportBounds.northEast;
      if (!southWest || !northEast) {
        return;
      }
      const sw = new mapboxgl.LngLat(southWest.lng, southWest.lat);
      const ne = new mapboxgl.LngLat(northEast.lng, northEast.lat);
      return new mapboxgl.LngLatBounds(sw, ne);
    };

    const getViewport = () => {
      const { clientWidth, clientHeight } = map.getContainer();
      return { width: clientWidth, height: clientHeight };
    };

    const frame = (bounds, shapes) => {
      if (!getFraming) {
        return null;
      }
      return getFraming({
        bounds: [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ],
        shapes,
        editor: getViewport(),
      });
    };

    const applyBounds = async bounds => {
      if (cancelled || !bounds || bounds.isEmpty()) {
        return;
      }

      const framing = frame(bounds, null);
      if (!framing) {
        map.fitBounds(bounds, {
          animate: false,
        });
        return;
      }

      // The framing is capped, so it is worth parsing the features now
      let focus = framing.focus;
      if (!focus) {
        const summary = await loadSummary();
        if (cancelled) {
          return;
        }
        focus = frame(bounds, summary?.shapes ?? null)?.focus ?? null;
      }

      if (cancelled) {
        return;
      }
      map.jumpTo({
        center: focus ?? bounds.getCenter().toArray(),
        zoom: framing.zoom,
      });
    };

    if (useConfigBounds) {
      const configBounds = getConfigBounds();
      if (configBounds) {
        applyBounds(configBounds).catch(() => {});
        return () => {
          cancelled = true;
        };
      }
    }

    // Bounds must come from the source. This fetch only runs when its result
    // will actually be consumed, because it will re-parse the GeoJSON, and may
    // even re-download it depending on browser.
    loadSummary()
      .then(summary => summary && applyBounds(summary.bounds))
      .catch(() => {
        // If fitBounds throws (e.g. on invalid bounds), just ignore it.
      });

    return () => {
      cancelled = true;
    };
  }, [
    map,
    visualizationConfig?.viewportConfig?.bounds,
    useConfigBounds,
    sourceName,
    changeBounds,
    getFraming,
  ]);

  const layer = useMemo(() => {
    if (!map || (useSvg && !imageSvg)) {
      return;
    }
    const { size, color } = visualizationConfig?.visualizeConfig || {};

    return {
      source: sourceName,
      filter: ['==', '$type', 'Point'],
      ...(useSvg
        ? {
            type: 'symbol',
            layout: {
              'icon-image': 'custom-marker',
              'icon-allow-overlap': true,
            },
            paint: {
              'icon-opacity': getOpacity(1),
              'text-opacity': getOpacity(1),
            },
          }
        : {
            type: 'circle',
            paint: {
              'circle-color': color,
              'circle-radius': size / 2.5,
              'circle-opacity': getOpacity(DEFAULT_MARKER_OPACITY),
              'circle-stroke-width': 2,
              'circle-stroke-color': color,
              'circle-stroke-opacity': getOpacity(1),
            },
          }),
      ...(useTileset ? { 'source-layer': visualizationConfig?.tilesetId } : {}),
    };
  }, [
    visualizationConfig?.visualizeConfig,
    visualizationConfig?.tilesetId,
    useSvg,
    imageSvg,
    useTileset,
    map,
    sourceName,
    getOpacity,
  ]);

  const layerEvents = useMemo(() => {
    if (!showPopups) {
      return [];
    }
    const pointer = map => () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const noPointer = map => () => {
      map.getCanvas().style.cursor = '';
    };
    const onUnclusteredPointClick = event => {
      openPopup(event.features[0], event);
    };
    return [
      ...(isMapFile
        ? []
        : [['click', `${sourceName}-markers`, onUnclusteredPointClick]]),
      map => ['mouseenter', `${sourceName}-markers`, pointer(map)],
      map => ['mouseleave', `${sourceName}-markers`, noPointer(map)],
    ];
  }, [isMapFile, openPopup, sourceName, showPopups]);

  const layerImages = useMemo(
    () => (useSvg ? [{ name: 'custom-marker', content: imageSvg }] : []),
    [imageSvg, useSvg]
  );

  const layerPolygonOutline = useMemo(() => {
    const { color } = visualizationConfig?.visualizeConfig || {};
    return {
      type: 'line',
      source: sourceName,
      layout: {},
      paint: {
        'line-color': color,
        'line-width': 3,
        'line-opacity': getOpacity(1),
      },
      ...(useTileset ? { 'source-layer': visualizationConfig?.tilesetId } : {}),
    };
  }, [
    useTileset,
    visualizationConfig?.visualizeConfig,
    visualizationConfig?.tilesetId,
    sourceName,
    getOpacity,
  ]);

  const layerPolygonFill = useMemo(() => {
    const { color, opacity } = visualizationConfig?.visualizeConfig || {};
    return {
      type: 'fill',
      source: sourceName,
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': color,
        'fill-opacity': getOpacity(opacity / 100),
      },
      ...(useTileset ? { 'source-layer': visualizationConfig?.tilesetId } : {}),
    };
  }, [
    useTileset,
    visualizationConfig?.visualizeConfig,
    visualizationConfig?.tilesetId,
    sourceName,
    getOpacity,
  ]);

  return (
    <>
      {layer && (
        <Layer
          id={generateLayerId(sourceName, LAYER_TYPES.MARKERS)}
          layer={layer}
          images={layerImages}
          events={layerEvents}
          onLayerAdded={onLayerAdded}
        />
      )}
      <Layer
        id={generateLayerId(sourceName, LAYER_TYPES.POLYGONS_OUTLINE)}
        layer={layerPolygonOutline}
        onLayerAdded={onLayerAdded}
      />
      <Layer
        id={generateLayerId(sourceName, LAYER_TYPES.POLYGONS_FILL)}
        layer={layerPolygonFill}
        onLayerAdded={onLayerAdded}
      />
      <Portal container={popupContainer}>
        {popupData?.data && <MarkerPopupContent data={popupData.data} />}
      </Portal>
    </>
  );
};

export default MapboxLayer;
