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

import * as util from 'util';
import { act, fireEvent, render, screen, waitFor, within } from 'tests/utils';
import { useParams } from 'react-router-dom';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import { mockTerrasoAPIrequestGraphQL } from 'tests/apiUtils';

import mapboxgl from 'gis/mapbox';
import GroupSharedDataVisualizationConfig from 'group/components/GroupSharedDataVisualizationConfig';
import LandscapeSharedDataVisualizationConfig from 'landscape/components/LandscapeSharedDataVisualizationConfig';
import * as visualizationMarkers from 'sharedData/visualization/visualizationMarkers';

import {
  DATA_SET_ACCPETED_EXTENSIONS,
  MAP_DATA_ACCEPTED_EXTENSIONS,
} from 'config';

// mapbox-gl 3.x no longer has TextDecoder defined
// https://github.com/mapbox/mapbox-gl-js/issues/13027
Object.defineProperty(window, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder,
});

jest.mock('terraso-client-shared/terrasoApi/api');
jest.mock('sharedData/visualization/visualizationMarkers');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));
jest.mock('gis/mapbox', () => ({}));

const DATA_SET_STEPS = ['File', 'Data', 'Appearance', 'Annotate', 'Preview'];
const MAP_STEPS = ['File', 'Appearance', 'Annotate', 'Preview'];

const TEST_CSV = `
col1,col2,col_longitude,col3,col4
val1,val2,-0.1791468188936136,-78.4800216447845,val4
`.trim();

const TEST_KML = `
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Placemark>
    <name>Simple placemark</name>
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
            -77.05485125901024,38.87076535397792,100
            -77.05577677433152,38.87008686581446,100
            -77.05691162017543,38.87054446963351,100
            -77.05668055019126,38.87154239798456,100
          </coordinates>
        </LinearRing>
      </innerBoundaryIs>
    </Polygon>
  </Placemark>
</kml>
`.trim();

const PARSED_KML_TO_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-122.0822035425683, 37.42228990140251],
      },
      properties: {},
    },
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

const isMapFile = selectFile => selectFile.includes('KML');
const isDataSetFile = selectFile => selectFile.includes('CSV');

const setup = async testParams => {
  const events = {};
  const map = {
    on: jest.fn().mockImplementation((...args) => {
      const event = args[0];
      const callback = args.length === 2 ? args[1] : args[2];
      const layer = args.length === 2 ? null : args[1];
      events[[event, layer].filter(p => p).join(':')] = callback;

      if (event === 'load') {
        callback();
      }
    }),
    remove: jest.fn(),
    off: jest.fn(),
    addControl: jest.fn(),
    removeControl: jest.fn(),
    addSource: jest.fn(),
    getSource: jest.fn(),
    addLayer: jest.fn(),
    getLayer: jest.fn(),
    setTerrain: jest.fn(),
    hasImage: jest.fn(),
    addImage: jest.fn(),
    fitBounds: jest.fn(),
    getStyle: jest.fn(),
    getBounds: jest.fn(),
    setPadding: jest.fn(),
    dragRotate: { disable: jest.fn() },
    touchZoomRotate: { disableRotation: jest.fn() },
  };
  map.getSource.mockReturnValueOnce();
  map.getSource.mockReturnValue({
    setData: jest.fn(),
    loaded: jest.fn().mockReturnValue(true),
  });
  mapboxgl.Map.mockReturnValue(map);
  mapboxgl.LngLat = jest.fn();
  useParams.mockReturnValue({
    slug: testParams.slug,
  });
  mockTerrasoAPIrequestGraphQL({
    'query landscapesToUploadSharedData(': Promise.resolve({
      landscapes: {
        edges: [
          {
            node: {
              membershipList: {
                accountMembership: {},
              },
              id: 'e9a65bef-4ef1-4058-bba3-fc73b53eb779',
              location: 'CM',
              name: 'Landscape Test',
              slug: 'landscape-slug',
              website: '',
            },
          },
        ],
      },
    }),
    'query groupToUploadSharedData(': Promise.resolve({
      groups: {
        edges: [
          {
            node: {
              accountMembership: {},
              id: 'b3e54b43-d437-4612-95f1-2e0585ab7806',
              name: 'Group Test',
              slug: 'group-slug',
            },
          },
        ],
      },
    }),
    'query dataEntries(': Promise.resolve({
      dataEntries: {
        edges: [
          {
            node: {
              createdAt: '2022-05-17T23:32:50.606587+00:00',
              createdBy: {
                id: 'dc695d00-d6b4-45b2-ab8d-f48206d998da',
                lastName: 'Buitrón',
                firstName: 'José',
              },
              description: '',
              id: 'f00c5564-cf93-471a-94c2-b930cbb0a4f8',
              name: 'CSV File',
              resourceType: 'csv',
              size: 3565,
              url: 'https://file-url',
              visualizations: { edges: [] },
            },
          },
          {
            node: {
              createdAt: '2022-05-17T23:32:50.606587+00:00',
              createdBy: {
                id: 'dc695d00-d6b4-45b2-ab8d-f48206d998da',
                lastName: 'Buitrón',
                firstName: 'José',
              },
              description: '',
              id: '0968419c-64ab-4561-ac72-671eedcde3ad',
              name: 'KML File',
              resourceType: 'kml',
              size: 3565,
              url: 'https://file-url',
              visualizations: { edges: [] },
            },
          },
        ],
      },
    }),
    'mutation addVisualizationConfig': Promise.resolve({
      addVisualizationConfig: {
        visualizationConfig: { id: 'b50b761e-faf8-471d-94ee-4991dc1cbd7f' },
      },
    }),
    'query dataEntryWithGeojson': Promise.resolve({
      dataEntry: {
        geojson: JSON.stringify(PARSED_KML_TO_GEOJSON),
      },
    }),
  });
  global.fetch.mockResolvedValue({
    status: 200,
    arrayBuffer: () => {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();

        reader.onerror = function onerror(ev) {
          reject(ev.target.error);
        };

        reader.onload = function onload(ev) {
          resolve(ev.target.result);
        };

        reader.readAsArrayBuffer(testParams.file);
      });
    },
    blob: () => {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();

        reader.onerror = function onerror(ev) {
          reject(ev.target.error);
        };

        reader.onload = function onload(ev) {
          resolve(ev.target.result);
        };

        reader.readAsText(testParams.file);
      });
    },
  });
  visualizationMarkers.getLayerImage.mockResolvedValue(
    'image/svg;base64,abc123'
  );
  const Component =
    testParams.type === 'landscape'
      ? LandscapeSharedDataVisualizationConfig
      : GroupSharedDataVisualizationConfig;
  await render(<Component />, {
    account: {
      currentUser: {
        data: {
          email: 'email@example.com',
          firstName: 'First',
          lastName: 'Last',
        },
      },
    },
  });
  return { map, events };
};

beforeEach(() => {
  global.fetch = jest.fn();
  mapboxgl.Popup = jest.fn();
  const Popup = {
    setLngLat: jest.fn().mockReturnThis(),
    setMaxWidth: jest.fn().mockReturnThis(),
    setDOMContent: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
  };
  mapboxgl.Popup.mockReturnValue(Popup);
  mapboxgl.NavigationControl = jest.fn();
  mapboxgl.LngLatBounds = jest.fn();
  mapboxgl.LngLatBounds.prototype = {
    isEmpty: jest.fn().mockReturnValue(false),
  };
  mapboxgl.Map = jest.fn();
});

const testSelectDataFileStep = async testParams => {
  // Validate accepted file types
  const fetchFilesCall = terrasoApi.requestGraphQL.mock.calls[3];
  expect(fetchFilesCall[1].resourceTypes).toStrictEqual([
    ...MAP_DATA_ACCEPTED_EXTENSIONS,
    ...DATA_SET_ACCPETED_EXTENSIONS,
  ]);

  // Validate stepper not present in first step
  expect(screen.queryByRole('list', { name: 'Steps' })).not.toBeInTheDocument();

  const filesList = within(screen.getByRole('list', { name: 'Select a file' }));
  const nextButton = screen.getByRole('button', { name: 'Next' });

  expect(nextButton).toHaveAttribute('disabled');

  fireEvent.click(
    filesList.getByRole('radio', { name: testParams.selectFile })
  );

  expect(nextButton).not.toHaveAttribute('disabled');

  await act(async () => fireEvent.click(nextButton));
};

const validateSelectValue = async (name, value) => {
  const select = screen.getByRole('combobox', { name });
  await act(async () => fireEvent.mouseDown(select));
  expect(
    within(screen.getByRole('listbox', { name })).getByRole('option', {
      name: value,
    })
  ).toHaveAttribute('aria-selected', 'true');
  await act(async () =>
    fireEvent.click(
      within(screen.getByRole('listbox', { name })).getByRole('option', {
        name: value,
      })
    )
  );
};
const changeSelectOption = async (name, newValue) => {
  await screen.findByRole('combobox', { name });
  const select = screen.getByRole('combobox', { name });

  await act(async () => fireEvent.mouseDown(select));
  await act(async () =>
    fireEvent.click(
      within(screen.getByRole('listbox', { name })).getByRole('option', {
        name: newValue,
      })
    )
  );
  await validateSelectValue(name, newValue);
};

const testStepper = async testParams => {
  // Validate stepper shows relevant steps for the selected file type
  const stepper = screen.getByRole('list', { name: 'Steps' });
  const steps = within(stepper).getAllByRole('listitem');
  if (isDataSetFile(testParams.selectFile)) {
    expect(steps).toHaveLength(DATA_SET_STEPS.length);
    for (const step in DATA_SET_STEPS) {
      expect(steps[step]).toHaveTextContent(DATA_SET_STEPS[step]);
    }
  }
  if (isMapFile(testParams.selectFile)) {
    expect(steps).toHaveLength(MAP_STEPS.length);
    for (const step in MAP_STEPS) {
      expect(steps[step]).toHaveTextContent(MAP_STEPS[step]);
    }
  }
};

const testSetDatasetStep = async testParams => {
  await waitFor(() =>
    expect(
      screen.getByRole('heading', {
        name: `Data from “${testParams.selectFile}”`,
      })
    )
  );

  await changeSelectOption('Latitude (required)', 'col3');
  await validateSelectValue('Longitude (required)', 'col_longitude');

  await changeSelectOption('Column 1', 'col1');
  await changeSelectOption('Column 3', 'col4');
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
};

const testVisualizeStep = async testParams => {
  await waitFor(() =>
    expect(
      screen.getByRole('heading', {
        name: 'Appearance',
      })
    )
  );

  // Marker Shape
  const shapes = screen.getByRole('group', { name: 'Symbol Shape:' });
  expect(
    within(shapes).getByRole('button', { name: 'Circle' })
  ).toHaveAttribute('aria-pressed', 'true');
  await act(async () =>
    fireEvent.click(within(shapes).getByRole('button', { name: 'Triangle' }))
  );

  // Marker Size
  const size = screen.getByRole('spinbutton', { name: 'Symbol Size:' });
  expect(size).toHaveValue(15);
  fireEvent.change(size, { target: { value: 30 } });
  expect(size).toHaveValue(30);

  // Color
  // TODO Known testing library issue: https://github.com/testing-library/user-event/issues/423#issuecomment-669368863
  // Input type color not supported
  const colorInput = screen.getByLabelText('Color:');
  expect(colorInput).toHaveValue('#ff580d');
  await act(async () =>
    fireEvent.input(colorInput, { target: { value: '#e28979' } })
  );
  expect(colorInput).toHaveValue('#e28979');

  if (isMapFile(testParams.selectFile)) {
    // Polygon opacity
    const opacity = screen.getByRole('spinbutton', {
      name: 'Polygon Opacity:',
    });
    expect(opacity).toHaveValue(50);
    fireEvent.change(opacity, { target: { value: 80 } });
    expect(opacity).toHaveValue(80);
  }

  // Next
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
};

const testAnnotateStep = async testParams => {
  // Map Title
  const mapTitle = screen.getByRole('textbox', {
    name: 'Map Title (required)',
  });
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
  expect(screen.getByText(/Enter a map title/i)).toBeInTheDocument();
  await act(async () =>
    fireEvent.change(mapTitle, { target: { value: 'Test Title' } })
  );
  expect(mapTitle).toHaveValue('Test Title');

  // Map Description
  const mapDescription = screen.getByRole('textbox', {
    name: 'Map Description',
  });
  await act(async () =>
    fireEvent.change(mapDescription, { target: { value: 'Test Description' } })
  );
  expect(mapDescription).toHaveValue('Test Description');

  if (isMapFile(testParams.selectFile)) {
    expect(
      screen.queryByRole('button', { name: 'Pop-up Title' })
    ).not.toBeInTheDocument();
  }

  if (isDataSetFile(testParams.selectFile)) {
    // Popup title
    await changeSelectOption('Pop-up Title', 'col4');

    // Data points labels
    const dataPoint = screen.getByRole('textbox', {
      name: 'Data point 1 label',
    });
    await act(async () =>
      fireEvent.change(dataPoint, { target: { value: 'Custom Label' } })
    );
  }

  // Next
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  );
};

const testPreviewStep = async (map, events, testParams) => {
  expect(screen.getByText('Test Description')).toBeInTheDocument();

  const LngLatBounds = jest.requireActual('mapbox-gl').LngLatBounds;
  const LngLat = jest.requireActual('mapbox-gl').LngLat;
  const sw = new LngLat(-76.29042998100137, 8.263885173441716);
  const ne = new LngLat(-67.62077603784013, 11.325606896067784);
  map.getBounds.mockReturnValue(new LngLatBounds(sw, ne));
  await act(async () => events['moveend']());

  const addSourceCall = map.addSource.mock.calls[0];
  expect(addSourceCall[0]).toBe('visualization');
  expect(addSourceCall[1]).toStrictEqual(testParams.expectedGeojsonSource);

  expect(map.addLayer).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'visualization-markers',
      source: 'visualization',
    }),
    undefined
  );
  if (isMapFile(testParams.selectFile)) {
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'visualization-polygons-outline',
        source: 'visualization',
      }),
      undefined
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'visualization-polygons-fill',
        source: 'visualization',
        paint: {
          'fill-color': '#FF580D',
          'fill-opacity': 0.8,
        },
      }),
      undefined
    );
  }
};

const BASE_CONFIGURATION_EXPECTED_INPUT = {
  viewportConfig: {
    bounds: {
      northEast: { lng: -67.62077603784013, lat: 11.325606896067784 },
      southWest: { lng: -76.29042998100137, lat: 8.263885173441716 },
    },
  },
};
test.each([
  [
    'landscape csv',
    {
      type: 'landscape',
      slug: 'landscape-slug',
      selectFile: 'CSV File',
      file: new File([TEST_CSV], `CSV File`, { type: 'text/csv' }),
      expectedDataEntriesFetchInput: {
        resourceTypes: [
          'geojson',
          'gpx',
          'json',
          'kml',
          'kmz',
          'zip',
          'csv',
          'xls',
          'xlsx',
        ],
        slug: 'landscape-slug',
        type: 'landscape',
      },
      expectedApiInput: {
        title: 'Test Title',
        description: 'Test Description',
        ownerId: 'e9a65bef-4ef1-4058-bba3-fc73b53eb779',
        ownerType: 'landscape',
        dataEntryId: 'f00c5564-cf93-471a-94c2-b930cbb0a4f8',
      },
      expectedConfiguration: {
        ...BASE_CONFIGURATION_EXPECTED_INPUT,
        visualizeConfig: {
          shape: 'triangle',
          size: '30',
          color: '#FF580D',
          opacity: 50,
        },
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
      },
      expectedGeojsonSource: {
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
      },
    },
  ],
  [
    'group kml',
    {
      type: 'group',
      slug: 'group-slug',
      selectFile: 'KML File',
      file: new File([TEST_KML], `KML File`, { type: 'application/xml' }),
      expectedDataEntriesFetchInput: {
        resourceTypes: [
          'geojson',
          'gpx',
          'json',
          'kml',
          'kmz',
          'zip',
          'csv',
          'xls',
          'xlsx',
        ],
        slug: 'group-slug',
        type: 'group',
      },
      expectedApiInput: {
        title: 'Test Title',
        description: 'Test Description',
        ownerId: 'b3e54b43-d437-4612-95f1-2e0585ab7806',
        ownerType: 'group',
        dataEntryId: '0968419c-64ab-4561-ac72-671eedcde3ad',
      },
      expectedConfiguration: {
        ...BASE_CONFIGURATION_EXPECTED_INPUT,
        visualizeConfig: {
          shape: 'triangle',
          size: '30',
          color: '#FF580D',
          opacity: 80,
        },
        datasetConfig: {
          dataColumns: {
            option: '',
            selectedColumns: ['', '', ''],
          },
        },
        annotateConfig: {
          dataPoints: [],
        },
      },
      expectedGeojsonSource: {
        type: 'geojson',
        data: PARSED_KML_TO_GEOJSON,
      },
    },
  ],
])(
  'VisualizationConfigForm: Create %s visualization',
  async (caseDescription, testParams) => {
    const preventDefault = jest.fn();
    window.onbeforeunload = jest.fn(event => {
      event.preventDefault = preventDefault;
    });
    const { map, events } = await setup(testParams);

    // Navigation is not blocked in the first step
    window.dispatchEvent(new Event('beforeunload'));
    expect(preventDefault).toHaveBeenCalledTimes(0);

    await testSelectDataFileStep(testParams);
    await testStepper(testParams);
    if (isDataSetFile(testParams.selectFile)) {
      await testSetDatasetStep(testParams);
    }
    await testVisualizeStep(testParams);
    await testAnnotateStep(testParams);
    await testPreviewStep(map, events, testParams);

    // Fetch data entries validation
    const fetchCall = terrasoApi.requestGraphQL.mock.calls[3];
    expect(fetchCall[1]).toStrictEqual(
      testParams.expectedDataEntriesFetchInput
    );

    // Blocked navigation
    window.dispatchEvent(new Event('beforeunload'));
    expect(preventDefault).toHaveBeenCalledTimes(1);

    // Save
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
    );
    const saveCall =
      terrasoApi.requestGraphQL.mock.calls[
        terrasoApi.requestGraphQL.mock.calls.length - 1
      ];
    expect(saveCall[1].input).toEqual(
      expect.objectContaining(testParams.expectedApiInput)
    );
    expect(JSON.parse(saveCall[1].input.configuration)).toStrictEqual(
      testParams.expectedConfiguration
    );

    // Navigation is not blocked after saving
    window.dispatchEvent(new Event('beforeunload'));
    expect(preventDefault).toHaveBeenCalledTimes(1);
  },
  30000
);
