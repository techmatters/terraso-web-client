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

import _ from 'lodash/fp';
import { normalizeText } from 'terraso-client-shared/utils';
import * as SheetsJs from 'xlsx';
import * as yup from 'yup';

import { normalizeLongitude } from 'terraso-web-client/gis/gisUtils';
import mapboxgl from 'terraso-web-client/gis/mapbox';
import { fetchDataEntriesWithGeojson } from 'terraso-web-client/sharedData/sharedDataService';

const LAT_COLUMN_OPTIONS = ['latitude', 'latitud', 'lat', 'x'];
const LNG_COLUMN_OPTIONS = ['longitude', 'longitud', 'lng', 'lon', 'long', 'y'];

const getScore = (options, header) => {
  const score = _.min(
    options
      .map((option, index) => (header.indexOf(option) + 1) * (index + 1))
      .filter(score => score > 0)
  );
  return score;
};

const getColumnMatch = scores => {
  const winner = _.flow(
    _.filter(value => value.score && value.score !== -1),
    _.sortBy(value => value.score),
    _.first
  )(scores);
  const column = winner ? winner.index : -1;
  return column;
};

export const identifyLatLngColumns = headers => {
  const cleanedHeaders = headers.map(normalizeText);
  const latScores = cleanedHeaders.map((header, index) => ({
    score: getScore(LAT_COLUMN_OPTIONS, header),
    index,
  }));
  const latColumnIndex = getColumnMatch(latScores);

  const lngScores = cleanedHeaders.map((header, index) => ({
    score: getScore(LNG_COLUMN_OPTIONS, header),
    index,
  }));
  const lngColumnIndex = getColumnMatch(lngScores);
  return {
    latColumn: latColumnIndex !== -1 ? headers[latColumnIndex] : null,
    lngColumn: lngColumnIndex !== -1 ? headers[lngColumnIndex] : null,
  };
};

export const readFile = async file => {
  const response = await fetch(file.url);
  const arrayBuffer = await response.arrayBuffer();
  const workbook = SheetsJs.read(arrayBuffer);
  return workbook;
};

export const readDataSetFile = async file => {
  const workbook = await readFile(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const sheetRef = SheetsJs.utils.decode_range(sheet['!ref']);
  const colCount = _.getOr(0, 'e.c', sheetRef);
  const rowCount = _.getOr(0, 'e.r', sheetRef);

  // {Object} s Start position
  // {Object} e End position
  // {number} e.c Column
  // {number} e.r Row
  const headersRange = SheetsJs.utils.encode_range({
    s: { c: 0, r: 0 },
    e: { c: colCount, r: 0 },
  });
  const headers = SheetsJs.utils.sheet_to_json(sheet, {
    range: headersRange,
    header: 1,
  })[0];
  const headersIndexes = _.fromPairs(
    headers.map((header, index) => [header, index])
  );
  return {
    headers,
    headersIndexes,
    colCount,
    rowCount,
    sheet,
  };
};

export const readMapFile = async dataEntry => {
  const response = await fetchDataEntriesWithGeojson({ id: dataEntry.id });
  const geojson = JSON.parse(response.geojson);
  return { geojson };
};

export const validateCoordinateColumn = (sheetContext, column) => {
  const columnIndex = sheetContext.headers.indexOf(column);
  const { rowCount, sheet } = sheetContext;

  // {Object} s Start position
  // {Object} e End position
  // {number} e.c Column
  // {number} e.r Row
  const range = SheetsJs.utils.encode_range({
    s: { c: columnIndex, r: 1 },
    e: { c: columnIndex, r: rowCount },
  });

  const values = SheetsJs.utils.sheet_to_json(sheet, {
    range,
    header: 1,
  });

  try {
    yup.array().of(yup.number()).validateSync(values);
    return null;
  } catch (error) {
    return error;
  }
};

export const validateCoordinateField = coordinate => ({
  name: 'invalidCoordinate',
  message: {
    key: 'invalid_coordinate',
    params: { coordinate },
  },
  test: (value, ctx) => {
    const {
      parent: {
        context: { fileContext },
      },
    } = ctx;
    if (_.isEmpty(value)) {
      return;
    }
    const error = validateCoordinateColumn(fileContext, value);
    if (!error) {
      return true;
    }
    return false;
  },
});

export const sheetToGeoJSON = (
  sheetContext,
  visualizationConfig,
  sampleSize
) => {
  const { datasetConfig, annotateConfig } = visualizationConfig || {};
  const { sheet, colCount, rowCount } = sheetContext;
  // {Object} s Start position
  // {Object} e End position
  // {number} e.c Column
  // {number} e.r Row
  const fullRange = SheetsJs.utils.encode_range({
    s: { c: 0, r: 0 },
    e: { c: colCount, r: rowCount },
  });
  const rows = SheetsJs.utils.sheet_to_json(sheet, {
    range: fullRange,
  });
  const dataPoints = annotateConfig?.dataPoints || [];
  const titleColumn = annotateConfig?.annotationTitle;
  let points = [];
  if (datasetConfig) {
    points = rows
      .map((row, index) => {
        const lat = parseFloat(row[datasetConfig.latitude]);
        const lng = normalizeLongitude(
          parseFloat(row[datasetConfig.longitude])
        );

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
  }

  const geoJson = {
    type: 'FeatureCollection',
    features: points.map(point => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: point.position,
      },
      properties: point,
    })),
  };
  return geoJson;
};
