/*
 * Copyright © 2025 Technology Matters
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

const DEFAULT_COLOR = '#FF580D';
const DEFAULT_OPACITY = 80;
const SUPPORTED_RESOURCE_TYPES = [
  'geojson',
  'gpx',
  'json',
  'kml',
  'kmz',
  'zip',
  'csv',
  'xls',
  'xlsx',
];

const CSV_TEST_DATA = `col1,col2,col_longitude,col3,col4
val1,val2,-0.1791468188936136,-78.4800216447845,val4`.trim();

const KML_TEST_DATA = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Placemark>
    <n>Simple placemark</n>
    <description>Attached to the ground. Intelligently places itself
       at the height of the underlying terrain.</description>
    <Point>
      <coordinates>-122.0822035425683,37.42228990140251,0</coordinates>
    </Point>
    <Polygon>
      <extrude>1</extrude>
      <altitudeMode>relativeToGround</altitudeMode>
      <outerBoundaryIs>
        <LinearRing>
          <coordinates>
            -77.05788457660967,38.87253259892824,100
            -77.05465973756702,38.87291016281703,100
            -77.05315536854791,38.87053267794386,100
            -77.05552622493516,38.868757801256,100
            -77.05844056290393,38.86996206506943,100
            -77.05788457660967,38.87253259892824,100
          </coordinates>
        </LinearRing>
      </outerBoundaryIs>
      <innerBoundaryIs>
        <LinearRing>
          <coordinates>
            -77.05668055019126,38.87154239798456,100
            -77.05542625960818,38.87167890344077,100
            -77.05577677433152,38.87008686581446,100
            -77.05691162017543,38.87054446963351,100
            -77.05668055019126,38.87154239798456,100
          </coordinates>
        </LinearRing>
      </innerBoundaryIs>
    </Polygon>
  </Placemark>
</kml>`.trim();

export const PARSED_GEOJSON_DATA = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-74.006, 40.7128],
      },
      properties: {
        name: 'New York City',
        population: 8419000,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-74.0, 40.7],
            [-74.02, 40.7],
            [-74.02, 40.72],
            [-74.0, 40.72],
            [-74.0, 40.7],
          ],
        ],
      },
      properties: {
        name: 'Sample Area',
      },
    },
    // feature with no geometry
    {
      type: 'Feature',
      properties: {
        name: 'Feature without geometry',
        description: 'This feature has no geometry defined.',
      },
    },
  ],
};

const GEOJSON_TEST_DATA = JSON.stringify(PARSED_GEOJSON_DATA);

export const TEST_DATA = {
  CSV: CSV_TEST_DATA,
  KML: KML_TEST_DATA,
  GEOJSON: GEOJSON_TEST_DATA,
};

export const PARSED_KML_TO_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-77.05788457660967, 38.87253259892824],
            [-77.05465973756702, 38.87291016281703],
            [-77.05315536854791, 38.87053267794386],
            [-77.05552622493516, 38.868757801256],
            [-77.05844056290393, 38.86996206506943],
            [-77.05788457660967, 38.87253259892824],
          ],
          [
            [-77.05668055019126, 38.87154239798456],
            [-77.05542625960818, 38.87167890344077],
            [-77.05577677433152, 38.87008686581446],
            [-77.05691162017543, 38.87054446963351],
            [-77.05668055019126, 38.87154239798456],
          ],
        ],
      },
      properties: {},
    },
  ],
};

export const FILE_TYPES = {
  CSV: {
    isDataSet: true,
    isMap: false,
    hasMarkers: true,
    hasPolygons: false,
    mimeType: 'text/csv',
    dataEntryId: 'f00c5564-cf93-471a-94c2-b930cbb0a4f8',
  },
  KML: {
    isDataSet: false,
    isMap: true,
    hasMarkers: false,
    hasPolygons: true,
    mimeType: 'application/xml',
    dataEntryId: '0968419c-64ab-4561-ac72-671eedcde3ad',
  },
  GEOJSON: {
    isDataSet: false,
    isMap: true,
    hasMarkers: true,
    hasPolygons: true,
    mimeType: 'application/geo+json',
    dataEntryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  },
};

export const TEST_ENTITIES = {
  landscape: {
    id: 'e9a65bef-4ef1-4058-bba3-fc73b53eb779',
    slug: 'landscape-slug',
    name: 'Landscape Test',
  },
  group: {
    id: 'b3e54b43-d437-4612-95f1-2e0585ab7806',
    slug: 'group-slug',
    name: 'Group Test',
  },
};

const createBaseVisualizationConfig = (overrides = {}) => ({
  color: DEFAULT_COLOR,
  opacity: DEFAULT_OPACITY,
  ...overrides,
});

const createEmptyDatasetConfig = () => ({
  dataColumns: {
    option: '',
    selectedColumns: ['', '', ''],
  },
});

const createEmptyAnnotateConfig = () => ({
  dataPoints: [],
});

export const createBaseTestParams = (entityType, fileType) => {
  const entity = TEST_ENTITIES[entityType];
  const fileConfig = FILE_TYPES[fileType];

  return {
    type: entityType,
    slug: entity.slug,
    selectFile: `${fileType} File`,
    hasPolygons: fileConfig.hasPolygons,
    hasMarkers: fileConfig.hasMarkers,
    file: new File([TEST_DATA[fileType]], `${fileType} File`, {
      type: fileConfig.mimeType,
    }),
    expectedDataEntriesFetchInput: {
      resourceTypes: SUPPORTED_RESOURCE_TYPES,
      slug: entity.slug,
      type: entityType,
    },
    expectedApiInput: {
      title: 'Test Title',
      description: 'Test Description',
      ownerId: entity.id,
      ownerType: entityType,
      dataEntryId: fileConfig.dataEntryId,
    },
  };
};

export const createCSVTestConfig = () => ({
  visualizeConfig: createBaseVisualizationConfig({
    shape: 'triangle',
    size: '30',
    opacity: 50,
  }),
  datasetConfig: {
    dataColumns: {
      option: 'custom',
      selectedColumns: ['col1', 'col4'],
    },
    longitude: 'col_longitude',
    latitude: 'col3',
  },
  annotateConfig: {
    annotationTitle: 'col4',
    dataPoints: [{ column: 'col1', label: 'Custom Label' }],
  },
});

export const createKMLTestConfig = () => ({
  visualizeConfig: createBaseVisualizationConfig({
    shape: 'circle',
    size: 15,
  }),
  datasetConfig: createEmptyDatasetConfig(),
  annotateConfig: createEmptyAnnotateConfig(),
});

export const createGeoJSONTestConfig = () => ({
  visualizeConfig: createBaseVisualizationConfig({
    shape: 'triangle',
    size: '30',
  }),
  datasetConfig: createEmptyDatasetConfig(),
  annotateConfig: createEmptyAnnotateConfig(),
});

export const createExpectedGeojsonSource = fileType => {
  switch (fileType) {
    case 'CSV':
      return {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [-0.17914681889362782, -78.4800216447845],
              },
              properties: {
                fields: '[]',
                index: 0,
                position: [-0.17914681889362782, -78.4800216447845],
                title: undefined,
              },
            },
          ],
        },
      };
    case 'KML':
      return {
        type: 'geojson',
        data: PARSED_KML_TO_GEOJSON,
      };
    case 'GEOJSON':
      return {
        type: 'geojson',
        data: PARSED_GEOJSON_DATA,
      };
    default:
      throw new Error(`Unknown file type: ${fileType}`);
  }
};

export const createTestParams = (entityType, fileType) => {
  const baseParams = createBaseTestParams(entityType, fileType);

  let specificConfig;
  switch (fileType) {
    case 'CSV':
      specificConfig = createCSVTestConfig();
      break;
    case 'KML':
      specificConfig = createKMLTestConfig();
      break;
    case 'GEOJSON':
      specificConfig = createGeoJSONTestConfig();
      break;
    default:
      throw new Error(`Unknown file type: ${fileType}`);
  }

  return {
    ...baseParams,
    expectedConfiguration: {
      ...BASE_CONFIGURATION_EXPECTED_INPUT,
      ...specificConfig,
    },
    expectedGeojsonSource: createExpectedGeojsonSource(fileType),
  };
};

export const BASE_CONFIGURATION_EXPECTED_INPUT = {
  viewportConfig: {
    bounds: {
      northEast: { lng: -67.62077603784013, lat: 11.325606896067784 },
      southWest: { lng: -76.29042998100137, lat: 8.263885173441716 },
    },
  },
};

export const isMapFile = selectFile => {
  const fileType = Object.keys(FILE_TYPES).find(type =>
    selectFile.includes(`${type} File`)
  );
  return fileType ? FILE_TYPES[fileType].isMap : false;
};

export const isDataSetFile = selectFile => {
  const fileType = Object.keys(FILE_TYPES).find(type =>
    selectFile.includes(`${type} File`)
  );
  return fileType ? FILE_TYPES[fileType].isDataSet : false;
};
