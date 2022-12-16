import { render, screen } from '@testing-library/react';
import React from 'react';
import * as SheetsJs from 'xlsx';
import _ from 'lodash/fp';

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
