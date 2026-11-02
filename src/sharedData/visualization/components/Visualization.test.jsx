/*
 * Copyright © 2026 Technology Matters
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

import { render } from 'terraso-web-client/tests/utils';
import * as SheetsJs from 'xlsx';

import { useMap } from 'terraso-web-client/gis/components/Map';
import mapboxgl from 'terraso-web-client/gis/mapbox';
import Visualization from 'terraso-web-client/sharedData/visualization/components/Visualization';
import { VisualizationContext } from 'terraso-web-client/sharedData/visualization/visualizationContext';
import * as visualizationUtils from 'terraso-web-client/sharedData/visualization/visualizationUtils';

jest.mock('terraso-web-client/gis/components/Map', () => ({
  __esModule: true,
  default: ({ children }) => children,
  useMap: jest.fn(),
}));
jest.mock('terraso-web-client/gis/components/MapControls', () => () => null);
jest.mock(
  'terraso-web-client/gis/components/MapStyleSwitcher',
  () => () => null
);
jest.mock(
  'terraso-web-client/sharedData/visualization/components/VisualizationMapLayer',
  () => () => null
);

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([
  ['title-only edits', { mapTitle: 'Updated title' }, 'Latitude', 0, 20],
  ['coordinate edits', { mapTitle: 'Initial title' }, 'Other latitude', 1, 30],
])(
  '%s trigger only necessary spreadsheet conversions and map source updates',
  async (
    _scenario,
    annotateConfig,
    latitude,
    expectedUpdates,
    expectedLatitude
  ) => {
    const addSource = jest.fn();
    useMap.mockReturnValue({ map: {}, addSource });
    mapboxgl.LngLat = jest.fn();
    const convertSheet = jest.spyOn(visualizationUtils, 'sheetToGeoJSON');
    const fileContext = {
      sheet: SheetsJs.utils.aoa_to_sheet([
        ['Latitude', 'Longitude', 'Other latitude'],
        [20, 10, 30],
      ]),
      rowCount: 1,
      colCount: 2,
    };
    const config = {
      annotateConfig: { mapTitle: 'Initial title' },
      datasetConfig: { latitude: 'Latitude', longitude: 'Longitude' },
      visualizeConfig: { shape: 'circle', size: 15, color: '#ff0000' },
    };
    const preview = visualizationConfig => (
      <VisualizationContext.Provider
        value={{ fileContext, isMapFile: false, visualizationConfig }}
      >
        <Visualization />
      </VisualizationContext.Provider>
    );
    const { rerender } = await render(preview(config));

    expect(convertSheet).toHaveBeenCalled();
    expect(addSource).toHaveBeenCalled();
    expect(
      addSource.mock.lastCall[1].data.features[0].geometry.coordinates
    ).toEqual([10, 20]);
    const initialGeoJson = addSource.mock.lastCall[1].data;
    convertSheet.mockClear();
    addSource.mockClear();

    rerender(
      preview({
        ...config,
        annotateConfig,
        datasetConfig: { ...config.datasetConfig, latitude },
      })
    );

    const currentGeoJson = addSource.mock.lastCall?.[1].data ?? initialGeoJson;
    expect(currentGeoJson.features[0].geometry.coordinates).toEqual([
      10,
      expectedLatitude,
    ]);
    expect({
      spreadsheetRebuilt: convertSheet.mock.calls.length > 0,
      mapSourceUpdates: addSource.mock.calls.length,
    }).toEqual({
      spreadsheetRebuilt: expectedUpdates > 0,
      mapSourceUpdates: expectedUpdates,
    });
  }
);
