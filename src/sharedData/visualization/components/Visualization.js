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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import _ from 'lodash/fp';
import * as SheetsJs from 'xlsx';
import Map, { LAYERS_BY_URL } from 'gis/components/Map';
import mapboxgl from 'gis/mapbox';
import './Visualization.css';
import { useTranslation } from 'react-i18next';
import {
  Marker as BaseMarker,
  FeatureGroup,
  Popup,
  useMap,
} from 'react-leaflet';
import { Box, Stack, Typography } from '@mui/material';
import MapboxMap, { useMap as useMapboxMap } from 'gis/components/MapboxMap';
import MapboxMapControls from 'gis/components/MapboxMapControls';
import MapboxMapStyleSwitcher from 'gis/components/MapboxMapStyleSwitcher';
import { normalizeLongitude } from 'gis/gisUtils';
import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';
import {
  getImageBitmap,
  getImageData,
} from 'sharedData/visualization/visualizationMarkers';

const Marker = props => {
  const { t } = useTranslation();
  const { point, index, icon } = props;

  const showPopup = point.title || !_.isEmpty(point.fields);
  return (
    <BaseMarker
      key={index}
      position={point.position}
      icon={icon}
      alt={point.title || `${t('gis.default_marker_label')} ${index + 1}`}
    >
      {showPopup && (
        <Popup
          className="visualization-marker-popup"
          closeButton={false}
          maxHeight={150}
        >
          <Box sx={{ p: 1 }}>
            {point.title && (
              <Typography
                variant="h6"
                component="h2"
                gutterBottom
                sx={{ fontSize: '1rem' }}
              >
                {point.title}
              </Typography>
            )}
            <Stack spacing={1}>
              {point.fields.map((field, index) => (
                <Stack key={index} direction="row" spacing={1}>
                  <Typography sx={{ fontSize: '0.8rem' }}>
                    {field.label}: {_.toString(field.value)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Popup>
      )}
    </BaseMarker>
  );
};

const Markers = props => {
  const featureGroupRef = useRef();
  const map = useMap();
  const { visualizationConfig, rows, sampleSize, icon, setSampleMarker } =
    props;
  const { datasetConfig, annotateConfig } = visualizationConfig || {};

  useEffect(() => {
    const viewportBounds = visualizationConfig?.viewportConfig?.bounds;
    const featureGroupBounds = featureGroupRef.current?.getBounds();

    if (!viewportBounds && !featureGroupBounds) {
      return;
    }

    const bounds = (() => {
      if (!viewportBounds) {
        return featureGroupBounds;
      }

      const southWest = viewportBounds.southWest;
      const northEast = viewportBounds.northEast;
      if (!southWest || !northEast) {
        return featureGroupBounds;
      }

      return [
        [southWest.lat, southWest.lng],
        [northEast.lat, northEast.lng],
      ];
    })();
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [visualizationConfig?.viewportConfig?.bounds, map]);

  useEffect(() => {
    if (!map || !featureGroupRef.current) {
      return;
    }
    if (setSampleMarker) {
      const markers = featureGroupRef.current.getLayers();
      if (!_.isEmpty(markers)) {
        setSampleMarker(markers[0]);
      }
    }
  }, [map, setSampleMarker]);

  if (!datasetConfig) {
    return null;
  }

  const dataPoints = _.getOr([], 'dataPoints', annotateConfig);
  const points = rows
    .map(row => {
      const lat = parseFloat(row[datasetConfig.latitude]);
      const lng = normalizeLongitude(parseFloat(row[datasetConfig.longitude]));

      const titleColumn = annotateConfig?.annotationTitle;

      const fields = dataPoints.map(dataPoint => ({
        label: dataPoint.label || dataPoint.column,
        value: row[dataPoint.column],
      }));

      return {
        position: [lat, lng],
        title: titleColumn && row[titleColumn],
        fields,
      };
    })
    .filter(point => point)
    .slice(0, sampleSize);

  return (
    <FeatureGroup ref={featureGroupRef}>
      {points.map((point, index) => (
        <Marker key={index} point={point} icon={icon} index={index} />
      ))}
    </FeatureGroup>
  );
};

const getMarkerIcon = visualizeConfig => {
  if (!visualizeConfig) {
    return null;
  }
  const { shape, size, color } = visualizeConfig;
  const imageData = getImageData({ shape, size, color });
  return new L.icon({
    className: 'visualization-preview-marker-image',
    iconUrl: imageData,
    iconSize: [size, size],
  });
};

const OpenSamplePopup = ({ marker }) => {
  const map = useMap();
  useEffect(() => {
    if (!marker) {
      return;
    }
    marker.openPopup();
  }, [map, marker]);
  return null;
};

const SetBaseLayer = props => {
  const map = useMap();
  const { visualizationConfig } = props;

  useEffect(() => {
    const baseMapUrl = visualizationConfig?.viewportConfig?.baseMapUrl;
    if (!baseMapUrl) {
      return;
    }

    LAYERS_BY_URL[baseMapUrl].addTo(map);
  }, [map, visualizationConfig?.viewportConfig?.baseMapUrl]);
  return null;
};

const MapboxSource = props => {
  const { rows, visualizationConfig, sampleSize } = props;
  const { map } = useMapboxMap();
  const { datasetConfig, annotateConfig } = visualizationConfig || {};
  const [imageBitmap, setImageBitmap] = useState();

  useEffect(() => {
    if (!visualizationConfig?.visualizeConfig) {
      return;
    }
    getImageBitmap(visualizationConfig?.visualizeConfig).then(setImageBitmap);
  }, [visualizationConfig?.visualizeConfig]);

  const points = useMemo(() => {
    const dataPoints = annotateConfig?.dataPoints || [];
    return rows
      .map(row => {
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
          position: [lng, lat],
          title: titleColumn && row[titleColumn],
          fields,
        };
      })
      .filter(point => point)
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
    if (!map || !geoJsonBounds) {
      return;
    }
    // Fit bounds
    const bounds = (() => {
      const viewportBounds = visualizationConfig?.viewportConfig?.bounds;

      if (!viewportBounds) {
        return geoJsonBounds;
      }

      const southWest = viewportBounds.southWest;
      const northEast = viewportBounds.northEast;
      if (!southWest || !northEast) {
        return geoJsonBounds;
      }
      const sw = new mapboxgl.LngLat(southWest.lng, southWest.lat);
      const ne = new mapboxgl.LngLat(northEast.lng, northEast.lat);
      return new mapboxgl.LngLatBounds(sw, ne);
    })();

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 50,
        animate: false,
      });
    }
  }, [map, geoJsonBounds, visualizationConfig?.viewportConfig?.bounds]);

  useEffect(() => {
    if (!map || !geoJson || !imageBitmap) {
      return;
    }

    if (map.getLayer('visualization')) {
      map.removeLayer('visualization');
    }
    if (map.hasImage('custom-marker')) {
      map.removeImage('custom-marker');
    }
    if (map.getSource('visualization')) {
      map.removeSource('visualization');
    }

    map.addSource('visualization', {
      type: 'geojson',
      data: geoJson,
    });

    map.addImage('custom-marker', imageBitmap);
    map.addLayer({
      id: 'visualization',
      type: 'symbol',
      source: 'visualization',
      layout: {
        'icon-image': 'custom-marker',
        'icon-allow-overlap': true,
      },
    });
  }, [map, geoJson, imageBitmap]);
};

const Visualization = props => {
  const {
    customConfig,
    showPopup = false,
    sampleSize,
    onBoundsChange,
    onBaseMapChange,
    children,
  } = props;
  const visualizationContext = useVisualizationContext();
  const { sheetContext } = useVisualizationContext();
  const { sheet, colCount, rowCount } = sheetContext;
  const [sampleMarker, setSampleMarker] = useState();

  const visualizationConfig = useMemo(
    () => ({
      ...visualizationContext.visualizationConfig,
      ...customConfig,
    }),
    [customConfig, visualizationContext.visualizationConfig]
  );

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

  const icon = useMemo(
    () => getMarkerIcon(visualizationConfig?.visualizeConfig),
    [visualizationConfig?.visualizeConfig]
  );

  return (
    <>
      <MapboxMap
        projection="mercator"
        onBoundsChange={onBoundsChange}
        sx={{
          width: '100%',
          height: '400px',
        }}
      >
        <MapboxMapControls />
        <MapboxMapStyleSwitcher />
        <MapboxSource
          visualizationConfig={visualizationConfig}
          rows={rows}
          sampleSize={sampleSize}
          setSampleMarker={setSampleMarker}
        />
      </MapboxMap>
      <Map
        onBoundsChange={onBoundsChange}
        onBaseMapChange={onBaseMapChange}
        style={{
          width: '100%',
          height: '400px',
        }}
      >
        <Markers
          visualizationConfig={visualizationConfig}
          rows={rows}
          sampleSize={sampleSize}
          icon={icon}
          setSampleMarker={setSampleMarker}
        />
        {showPopup && <OpenSamplePopup marker={sampleMarker} />}
        <SetBaseLayer visualizationConfig={visualizationConfig} />
        {children}
      </Map>
    </>
  );
};

export default Visualization;
