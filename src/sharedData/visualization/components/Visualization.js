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

import mapboxgl from 'gis/mapbox';

import './Visualization.css';

import bbox from '@turf/bbox';
import { Box, Portal, Stack, Typography } from '@mui/material';

import GeoJsonSource from 'gis/components/GeoJsonSource';
import Map, { useMap } from 'gis/components/Map';
import MapControls from 'gis/components/MapControls';
import MapStyleSwitcher from 'gis/components/MapStyleSwitcher';
import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';
import { getLayerImage } from 'sharedData/visualization/visualizationMarkers';

import { sheetToGeoJSON } from '../visualizationUtils';

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
const MapboxRemoteSource = props => {
  const { visualizationConfig } = props;
  const { map, addSource } = useMap();
  const { tilesetId } = visualizationConfig || {};
  useEffect(() => {
    if (!map || !tilesetId) {
      return;
    }

    addSource('visualization', {
      type: 'vector',
      url: `mapbox://terraso.${tilesetId}`,
    });
  }, [map, addSource, tilesetId]);
};

const FileContextSource = props => {
  const { visualizationConfig, sampleSize } = props;
  const { fileContext, isMapFile } = useVisualizationContext();

  const geoJson = useMemo(
    () =>
      isMapFile
        ? fileContext.geojson
        : sheetToGeoJSON(fileContext, visualizationConfig, sampleSize),
    [isMapFile, fileContext, visualizationConfig, sampleSize]
  );

  return (
    <GeoJsonSource
      id="visualization"
      geoJson={geoJson}
      fitGeoJsonBounds={!visualizationConfig?.viewportConfig?.bounds}
    />
  );
};

const MapboxLayer = props => {
  const { visualizationConfig, showPopup, useConfigBounds } = props;
  const { map, addImage, addLayer } = useMap();
  const [imageSvg, setimageSvg] = useState();
  const [popupData, setPopupData] = useState(null);
  const popupContainer = useMemo(() => document.createElement('div'), []);
  const { useTileset } = useVisualizationContext();

  const useSvg = useMemo(
    () => visualizationConfig?.visualizeConfig?.shape !== 'circle',
    [visualizationConfig?.visualizeConfig]
  );

  const popup = useMemo(
    () =>
      new mapboxgl.Popup({
        className: 'visualization-marker-popup',
      }).setDOMContent(popupContainer),
    [popupContainer]
  );

  useEffect(() => {
    if (!visualizationConfig?.visualizeConfig) {
      return;
    }
    getLayerImage(visualizationConfig?.visualizeConfig).then(setimageSvg);
  }, [visualizationConfig?.visualizeConfig]);

  const openPopup = useCallback((feature, event) => {
    if (!feature) {
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
  }, []);

  useEffect(() => {
    if (!map || (useSvg && !imageSvg)) {
      return;
    }
    const { size, color } = visualizationConfig?.visualizeConfig || {};

    const layer = {
      id: 'visualization',
      source: 'visualization',
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
              'circle-opacity': 0.5,
              'circle-stroke-width': 2,
              'circle-stroke-color': color,
            },
          }),
      ...(useTileset ? { 'source-layer': visualizationConfig?.tilesetId } : {}),
    };

    if (map.getLayer('visualization')) {
      map.removeLayer('visualization');
    }
    if (map.hasImage('custom-marker')) {
      map.removeImage('custom-marker');
    }

    addImage('custom-marker', imageSvg);
    addLayer(layer);
    const pointer = () => (map.getCanvas().style.cursor = 'pointer');
    const noPointer = () => (map.getCanvas().style.cursor = '');
    const onUnclusteredPointClick = event => {
      openPopup(event.features[0], event);
    };
    map.on('click', 'visualization', onUnclusteredPointClick);
    map.on('mouseenter', 'visualization', pointer);
    map.on('mouseleave', 'visualization', noPointer);
  }, [
    map,
    addImage,
    addLayer,
    imageSvg,
    openPopup,
    useTileset,
    visualizationConfig?.tilesetId,
    visualizationConfig?.visualizeConfig,
    useSvg,
  ]);

  useEffect(() => {
    if (!map || !popupData?.coordinates) {
      return;
    }
    popup.setLngLat(popupData?.coordinates);
    if (!popup.isOpen()) {
      popup.addTo(map);
    }
  }, [popup, popupData?.coordinates, map]);

  useEffect(() => {
    if (!showPopup || !map) {
      return;
    }
    const source = map.getSource('visualization');
    if (!source) {
      return;
    }
    const features = source._data.features;
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
    const visualizationConfigBounds = (function () {
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

    const geoJsonBounds = (function () {
      const source = map.getSource('visualization');
      if (!source || !source._data) {
        return;
      }
      const calculatedBbox = bbox(map.getSource('visualization')._data);
      return new mapboxgl.LngLatBounds(
        [calculatedBbox[0], calculatedBbox[1]],
        [calculatedBbox[2], calculatedBbox[3]]
      );
    })();

    const bounds =
      useConfigBounds && visualizationConfigBounds
        ? visualizationConfigBounds
        : geoJsonBounds;

    if (bounds && !bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 50,
        animate: false,
      });
    }
  }, [map, visualizationConfig?.viewportConfig?.bounds, useConfigBounds]);

  return (
    <Portal container={popupContainer}>
      {popupData?.data && <PopupContent data={popupData.data} />}
    </Portal>
  );
};

const Visualization = props => {
  const {
    customConfig,
    showPopup = false,
    sampleSize,
    onBoundsChange,
    onStyleChange,
    useConfigBounds,
    children,
  } = props;
  const visualizationContext = useVisualizationContext();
  const { useTileset } = visualizationContext;

  const visualizationConfig = useMemo(
    () => ({
      ...visualizationContext.visualizationConfig,
      ...customConfig,
    }),
    [customConfig, visualizationContext.visualizationConfig]
  );

  return (
    <>
      <Map
        disableRotation
        disableElevation
        projection="mercator"
        mapStyle={visualizationConfig?.viewportConfig?.baseMapStyle}
        onBoundsChange={onBoundsChange}
        onStyleChange={onStyleChange}
        sx={{
          width: '100%',
          height: '400px',
        }}
      >
        <MapControls />
        <MapStyleSwitcher />
        {useTileset ? (
          <MapboxRemoteSource visualizationConfig={visualizationConfig} />
        ) : (
          visualizationContext.fileContext && (
            <FileContextSource
              visualizationConfig={visualizationConfig}
              sampleSize={sampleSize}
            />
          )
        )}
        <MapboxLayer
          visualizationConfig={visualizationConfig}
          showPopup={showPopup}
          useConfigBounds={useConfigBounds}
        />
        {children}
      </Map>
    </>
  );
};

export default Visualization;
