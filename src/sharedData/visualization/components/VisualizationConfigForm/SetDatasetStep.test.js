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

import React from 'react';

import { render, screen } from '@testing-library/react';
import _ from 'lodash/fp';
import * as SheetsJs from 'xlsx';

import { VisualizationContext } from 'sharedData/visualization/visualizationContext';

import { DatasetPreview } from './SetDatasetStep';

// these libraries will print warning if they are not mocked!
jest.mock('react-redux');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn(),
  }),
}));

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
    sheetContext: {
      selectedFile,
      sheet,
      headers,
      colCount,
      rowCount,
      headersIndexes,
    },
  };
}

test('Dataset Preview rendered', async () => {
  const value = mockCSVProps(
    ['foo', 'bar', 'blem'],
    [
      [1, 2, 3],
      [2, 1, 2],
      [4, 5, 6],
    ]
  );
  render(
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

test('Dataset Preview with null columns', async () => {
  const defectiveArray = [];
  defectiveArray[0] = 1;
  defectiveArray[2] = 3;
  const value = mockCSVProps(['foo', 'bar', 'baz'], [defectiveArray]);
  render(
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
