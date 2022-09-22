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
