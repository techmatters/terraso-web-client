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
import * as SheetsJs from 'xlsx';
import mapboxgl from 'gis/mapbox';
import './Visualization.css';
import { Box, Portal, Stack, Typography } from '@mui/material';
import MapboxMap, { useMap as useMapboxMap } from 'gis/components/MapboxMap';
import MapboxMapControls from 'gis/components/MapboxMapControls';
import MapboxMapStyleSwitcher from 'gis/components/MapboxMapStyleSwitcher';
import { normalizeLongitude } from 'gis/gisUtils';
import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';
import { getImage } from 'sharedData/visualization/visualizationMarkers';

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
  const { map, addSource } = useMapboxMap();
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

const MapboxGeoJsonSource = props => {
  const { visualizationConfig, sampleSize } = props;
  const { map, addSource } = useMapboxMap();
  const { datasetConfig, annotateConfig } = visualizationConfig || {};
  const { sheetContext } = useVisualizationContext();
  const { sheet, colCount, rowCount } = sheetContext;
  const fullRange = useMemo(
    () =>
      // {Object} s Start position
      // {Object} e End position
      // {number} e.c Column
      // {number} e.r Row
      SheetsJs.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: colCount, r: rowCount },
      }),
    [colCount, rowCount]
  );
  const rows = useMemo(
    () =>
      SheetsJs.utils.sheet_to_json(sheet, {
        range: fullRange,
      }),
    [sheet, fullRange]
  );

  const points = useMemo(() => {
    const dataPoints = annotateConfig?.dataPoints || [];
    return rows
      .map((row, index) => {
        const lat = parseFloat(row[datasetConfig.latitude]);
        const lng = normalizeLongitude(
          parseFloat(row[datasetConfig.longitude])
        );

        const titleColumn = annotateConfig?.annotationTitle;

        const fields = dataPoints.map(dataPoint => ({
          label: dataPoint.label || dataPoint.column,
          value: row[dataPoint.column],
        }));

        return {
          index,
          position: [lng, lat],
          title: titleColumn && row[titleColumn],
          fields: JSON.stringify(fields),
        };
      })
      .filter(point => {
        try {
          new mapboxgl.LngLat(...point.position);
          return true;
        } catch (error) {
          return false;
        }
      })
      .slice(0, sampleSize);
  }, [
    rows,
    datasetConfig,
    annotateConfig?.dataPoints,
    annotateConfig?.annotationTitle,
    sampleSize,
  ]);

  const geoJson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: points.map(point => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: point.position,
        },
        properties: point,
      })),
    }),
    [points]
  );

  const geoJsonBounds = useMemo(
    () =>
      points.reduce((bounds, point) => {
        try {
          return bounds.extend(point.position);
        } catch (error) {
          return bounds;
        }
      }, new mapboxgl.LngLatBounds()),
    [points]
  );

  useEffect(() => {
    if (!map || !geoJsonBounds || visualizationConfig?.viewportConfig?.bounds) {
      return;
    }

    if (!geoJsonBounds.isEmpty()) {
      map.fitBounds(geoJsonBounds, {
        padding: 50,
        animate: false,
        maxZoom: 10,
      });
    }
  }, [map, geoJsonBounds, visualizationConfig?.viewportConfig?.bounds]);

  useEffect(() => {
    if (!map || !geoJson) {
      return;
    }

    const geojsonSource = map.getSource('visualization');
    if (!geojsonSource) {
      addSource('visualization', {
        type: 'geojson',
        data: geoJson,
      });
    } else {
      geojsonSource.setData(geoJson);
    }
  }, [map, addSource, geoJson]);
};

const MapboxLayer = props => {
  const { visualizationConfig, showPopup } = props;
  const { map, addImage, addLayer } = useMapboxMap();
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
    getImage(visualizationConfig?.visualizeConfig).then(setimageSvg);
  }, [visualizationConfig?.visualizeConfig]);

  useEffect(() => {
    if (!map || !visualizationConfig?.viewportConfig?.bounds) {
      return;
    }
    const viewportBounds = visualizationConfig?.viewportConfig?.bounds;

    const southWest = viewportBounds.southWest;
    const northEast = viewportBounds.northEast;
    if (!southWest || !northEast) {
      return;
    }
    const sw = new mapboxgl.LngLat(southWest.lng, southWest.lat);
    const ne = new mapboxgl.LngLat(northEast.lng, northEast.lat);
    const bounds = new mapboxgl.LngLatBounds(sw, ne);

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 50,
        animate: false,
        maxZoom: 10,
      });
    }
  }, [map, visualizationConfig?.viewportConfig?.bounds]);

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
    popup.setLngLat(popupData?.coordinates).addTo(map);
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
  ]);

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
      <MapboxMap
        disableRotation
        projection="mercator"
        style={visualizationConfig?.viewportConfig?.baseMapStyle}
        onBoundsChange={onBoundsChange}
        onStyleChange={onStyleChange}
        sx={{
          width: '100%',
          height: '400px',
        }}
      >
        <MapboxMapControls />
        <MapboxMapStyleSwitcher />
        {useTileset ? (
          <MapboxRemoteSource visualizationConfig={visualizationConfig} />
        ) : (
          <MapboxGeoJsonSource
            visualizationConfig={visualizationConfig}
            sampleSize={sampleSize}
          />
        )}
        <MapboxLayer
          visualizationConfig={visualizationConfig}
          showPopup={showPopup}
        />
        {children}
      </MapboxMap>
    </>
  );
};

export default Visualization;
