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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import bbox from '@turf/bbox';
import _ from 'lodash/fp';
import logger from 'terraso-client-shared/monitoring/logger';
import { Box, Portal, Stack, Typography } from '@mui/material';

import Layer from 'gis/components/Layer';
import { useMap } from 'gis/components/Map';
import mapboxgl from 'gis/mapbox';
import { getLayerImage } from 'sharedData/visualization/visualizationMarkers';

const DEFAULT_MARKER_OPACITY = 1;

export const LAYER_TYPES = ['markers', 'polygons-outline', 'polygons-fill'];

// Opacity range between 0 - 100
export const getLayerOpacity = (type, visualizationConfig) => {
  if (type !== 'polygons-fill') {
    return DEFAULT_MARKER_OPACITY;
  }
  const opacity =
    visualizationConfig?.visualizeConfig?.opacity || DEFAULT_MARKER_OPACITY;
  return opacity / 100;
};

const getSourceBounds = async (map, sourceId) => {
  const source = map.getSource(sourceId);
  const loaded = source?.loaded();
  if (!source) {
    return;
  }

  const loadedSource = loaded
    ? source
    : await new Promise(resolve => {
        map.on('sourcedata', () => {
          const source = map.getSource(sourceId);
          if (source.loaded()) {
            resolve(source);
          }
        });
      });

  if (loadedSource.bounds) {
    return new mapboxgl.LngLatBounds(loadedSource.bounds);
  }

  if (!loadedSource._data) {
    return;
  }

  const calculatedBbox = bbox(loadedSource._data);
  return new mapboxgl.LngLatBounds(
    [calculatedBbox[0], calculatedBbox[1]],
    [calculatedBbox[2], calculatedBbox[3]]
  );
};

const parsePopupJsonFields = content => {
  try {
    return JSON.parse(content);
  } catch (error) {
    logger.error('Failed to parse popup JSON content', error);
  }
  return [];
};

const PopupContent = props => {
  const { data } = props;
  const fields = parsePopupJsonFields(data.fields);
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
    showPopup,
    useConfigBounds,
    changeBounds = true,
    useTileset,
    isMapFile,
    opacity: initialOpacity,
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
    if (!showPopup || !map) {
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
    showPopup,
    openPopup,
    map,
    visualizationConfig?.annotateConfig?.annotationTitle,
    visualizationConfig?.annotateConfig?.dataPoints,
    sourceName,
  ]);

  useEffect(() => {
    if (!map) {
      return;
    }
    const visualizationConfigBounds = (async function () {
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
    })();

    const sourceBounds = getSourceBounds(map, sourceName);

    Promise.all([visualizationConfigBounds, sourceBounds]).then(
      ([visualizationConfigBounds, sourceBounds]) => {
        if (!changeBounds) {
          return;
        }
        const bounds =
          useConfigBounds && visualizationConfigBounds
            ? visualizationConfigBounds
            : sourceBounds;

        if (bounds && !bounds.isEmpty()) {
          map.fitBounds(bounds, {
            animate: false,
          });
        }
      }
    );
  }, [
    map,
    visualizationConfig?.viewportConfig?.bounds,
    useConfigBounds,
    sourceName,
    changeBounds,
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
  }, [isMapFile, openPopup, sourceName]);

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
          id={`${sourceName}-markers`}
          layer={layer}
          images={layerImages}
          events={layerEvents}
        />
      )}
      <Layer
        id={`${sourceName}-polygons-outline`}
        layer={layerPolygonOutline}
      />
      <Layer id={`${sourceName}-polygons-fill`} layer={layerPolygonFill} />
      <Portal container={popupContainer}>
        {popupData?.data && <PopupContent data={popupData.data} />}
      </Portal>
    </>
  );
};

export default MapboxLayer;
