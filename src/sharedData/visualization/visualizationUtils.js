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

import * as SheetsJs from 'xlsx';
import * as yup from 'yup';

export const readFile = async file => {
  const response = await fetch(file.url);
  const arrayBuffer = await response.arrayBuffer();
  const workbook = SheetsJs.read(arrayBuffer);
  return workbook;
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
