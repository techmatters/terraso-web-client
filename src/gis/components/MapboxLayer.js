import React, { useCallback, useEffect, useMemo, useState } from 'react';
import bbox from '@turf/bbox';
import _ from 'lodash/fp';
import { Box, Portal, Stack, Typography } from '@mui/material';

import Layer from 'gis/components/Layer';
import { useMap } from 'gis/components/Map';
import mapboxgl from 'gis/mapbox';
import { getLayerImage } from 'sharedData/visualization/visualizationMarkers';

const DEFAULT_MARKER_OPACITY = 1;

const getSourceBounds = async (map, sourceId) => {
  const source = map.getSource(sourceId);
  const loaded = source.loaded();
  if (!source) {
    return;
  }

  const loadedSource = loaded
    ? source
    : await new Promise(resolve => {
        map.on('sourcedata', () => {
          const source = map.getSource('visualization');
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

const PopupContent = props => {
  const { data } = props;
  const fields = JSON.parse(data.fields);
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
    visualizationConfig,
    showPopup,
    useConfigBounds,
    useTileset,
    isMapFile,
  } = props;
  const { map } = useMap();
  const [imageSvg, setimageSvg] = useState();
  const [popupData, setPopupData] = useState(null);
  const popupContainer = useMemo(() => document.createElement('div'), []);

  const useSvg = useMemo(
    () => visualizationConfig?.visualizeConfig?.shape !== 'circle',
    [visualizationConfig?.visualizeConfig]
  );

  const popup = useMemo(
    () =>
      isMapFile
        ? null
        : new mapboxgl.Popup({
            className: 'visualization-marker-popup',
          }).setDOMContent(popupContainer),
    [popupContainer, isMapFile]
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
    const source = map.getSource('visualization');
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

    const sourceBounds = getSourceBounds(map, 'visualization');

    Promise.all([visualizationConfigBounds, sourceBounds]).then(
      ([visualizationConfigBounds, sourceBounds]) => {
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
  }, [map, visualizationConfig?.viewportConfig?.bounds, useConfigBounds]);

  const layer = useMemo(() => {
    if (!map || (useSvg && !imageSvg)) {
      return;
    }
    const { size, color } = visualizationConfig?.visualizeConfig || {};

    return {
      source: 'visualization',
      filter: ['==', '$type', 'Point'],
      ...(useSvg
        ? {
            type: 'symbol',
            layout: {
              'icon-image': 'custom-marker',
              'icon-allow-overlap': true,
            },
          }
        : {
            type: 'circle',
            paint: {
              'circle-color': color,
              'circle-radius': size / 2.5,
              'circle-opacity': DEFAULT_MARKER_OPACITY,
              'circle-stroke-width': 2,
              'circle-stroke-color': color,
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
  ]);

  console.log({ layer });

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
        : [['click', 'visualization-markers', onUnclusteredPointClick]]),
      map => ['mouseenter', 'visualization-markers', pointer(map)],
      map => ['mouseleave', 'visualization-markers', noPointer(map)],
    ];
  }, [isMapFile, openPopup]);

  const layerImages = useMemo(
    () => (useSvg ? [{ name: 'custom-marker', content: imageSvg }] : []),
    [imageSvg, useSvg]
  );

  const layerPolygonOutline = useMemo(() => {
    const { color } = visualizationConfig?.visualizeConfig || {};
    return {
      type: 'line',
      source: 'visualization',
      layout: {},
      paint: {
        'line-color': color,
        'line-width': 3,
      },
      ...(useTileset ? { 'source-layer': visualizationConfig?.tilesetId } : {}),
    };
  }, [
    useTileset,
    visualizationConfig?.visualizeConfig,
    visualizationConfig?.tilesetId,
  ]);

  const layerPolygonFill = useMemo(() => {
    const { color, opacity } = visualizationConfig?.visualizeConfig || {};
    return {
      type: 'fill',
      source: 'visualization',
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': color,
        'fill-opacity': opacity / 100,
      },
      ...(useTileset ? { 'source-layer': visualizationConfig?.tilesetId } : {}),
    };
  }, [
    useTileset,
    visualizationConfig?.visualizeConfig,
    visualizationConfig?.tilesetId,
  ]);

  return (
    <>
      {layer && (
        <Layer
          id="visualization-markers"
          layer={layer}
          images={layerImages}
          events={layerEvents}
        />
      )}
      <Layer id="visualization-polygons-outline" layer={layerPolygonOutline} />
      <Layer id="visualization-polygons-fill" layer={layerPolygonFill} />
      <Portal container={popupContainer}>
        {popupData?.data && <PopupContent data={popupData.data} />}
      </Portal>
    </>
  );
};

export default MapboxLayer;
