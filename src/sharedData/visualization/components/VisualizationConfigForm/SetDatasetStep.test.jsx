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

import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from 'terraso-web-client/tests/utils';
import _ from 'lodash/fp';
import * as SheetsJs from 'xlsx';

import SetDatasetStep, {
  DatasetPreview,
} from 'terraso-web-client/sharedData/visualization/components/VisualizationConfigForm/SetDatasetStep';
import { VisualizationContext } from 'terraso-web-client/sharedData/visualization/visualizationContext';

function mockCSVProps(headers, rows) {
  const sheet = SheetsJs.utils.aoa_to_sheet([headers, ...rows]);
  const rowCount = rows.length;
  const colCount = headers.length;
  const headersIndexes = _.fromPairs(
    headers.map((header, index) => [header, index])
  );
  const selectedFile = { id: 1 };
  return {
    visualizationConfig: { selectedFile },
    fileContext: {
      selectedFile,
      sheet,
      headers,
      colCount,
      rowCount,
      headersIndexes,
    },
  };
}

test('SetDatasetStep: Dataset Preview rendered', async () => {
  const value = mockCSVProps(
    ['foo', 'bar', 'blem'],
    [
      [1, 2, 3],
      [2, 1, 2],
      [4, 5, 6],
    ]
  );
  await render(
    <VisualizationContext.Provider value={value}>
      <DatasetPreview />
    </VisualizationContext.Provider>
  );

  expect(screen.getByRole('table')).toBeInTheDocument();
  expect(
    screen.queryAllByRole('columnheader').map(node => node.textContent)
  ).toEqual(['foo', 'bar', 'blem']);
  expect(screen.queryAllByRole('cell').map(node => node.textContent)).toEqual([
    '1',
    '2',
    '3',
    '2',
    '1',
    '2',
    '4',
    '5',
    '6',
  ]);
});

test('SetDatasetStep: Dataset Preview with null columns', async () => {
  const defectiveArray = [];
  defectiveArray[0] = 1;
  defectiveArray[2] = 3;
  const value = mockCSVProps(['foo', 'bar', 'baz'], [defectiveArray]);
  await render(
    <VisualizationContext.Provider value={value}>
      <DatasetPreview />
    </VisualizationContext.Provider>
  );
  expect(screen.queryAllByRole('cell').map(node => node.textContent)).toEqual([
    '1',
    '',
    '3',
  ]);
});

test('SetDatasetStep: Longitude and latitude auto detected', async () => {
  const value = mockCSVProps(
    ['lat', 'lng', 'foo', 'bar'],
    [
      [1, 2, 3, 4],
      [2, 1, 2, 3],
      [4, 5, 6, 7],
    ]
  );
  await render(
    <VisualizationContext.Provider value={value}>
      <SetDatasetStep />
    </VisualizationContext.Provider>
  );

  await act(async () =>
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'Latitude (required)' })
    )
  );
  const latitudeList = screen.getByRole('listbox', {
    name: 'Latitude (required)',
  });
  expect(
    within(latitudeList).getByRole('option', {
      name: 'lat',
    })
  ).toHaveAttribute('aria-selected', 'true');
  await act(async () =>
    fireEvent.click(
      within(latitudeList).getByRole('option', {
        name: 'lat',
      })
    )
  );

  await act(async () =>
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'Longitude (required)' })
    )
  );
  expect(
    within(
      screen.getByRole('listbox', { name: 'Longitude (required)' })
    ).getByRole('option', {
      name: 'lng',
    })
  ).toHaveAttribute('aria-selected', 'true');
});
