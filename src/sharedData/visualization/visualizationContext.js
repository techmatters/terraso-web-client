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
import React, { useCallback, useContext, useEffect, useState } from 'react';
import _ from 'lodash/fp';
import { useDispatch } from 'react-redux';
import { addMessage } from 'terraso-client-shared/notifications/notificationsSlice';
import * as SheetsJs from 'xlsx';
import { readFile } from 'sharedData/visualization/visualizationUtils';

export const VisualizationContext = React.createContext();

export const VisualizationContextProvider = props => {
  const dispatch = useDispatch();
  const { visualizationConfig, setVisualizationConfig, children } = props;
  const [sheetContext, setSheetContext] = useState();
  const [loadingFile, setLoadingFile] = useState(true);
  const [loadingFileError, setLoadingFileError] = useState();

  useEffect(() => {
    if (!visualizationConfig.selectedFile) {
      return;
    }
    const newSheetContext =
      visualizationConfig?.selectedFile?.id !== sheetContext?.selectedFile?.id;
    if (!newSheetContext) {
      return;
    }
    setLoadingFile(true);
    setSheetContext(undefined);
    const readFileRequest = {
      promise: readFile(visualizationConfig.selectedFile),
      valid: true,
    };
    readFileRequest.promise
      .then(workbook => {
        if (!readFileRequest.valid) {
          return;
        }
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
        setSheetContext({
          headers,
          headersIndexes,
          colCount,
          rowCount,
          sheet,
          selectedFile: visualizationConfig.selectedFile,
        });

        setLoadingFile(false);
      })
      .catch(error => {
        setLoadingFileError(error);
        setLoadingFile(false);
        dispatch(
          addMessage({
            severity: 'error',
            content: 'sharedData.visualization_file_load_error',
            params: { name: visualizationConfig.selectedFile.name },
          })
        );
      });
    return () => {
      readFileRequest.valid = false;
    };
  }, [visualizationConfig.selectedFile, sheetContext, dispatch]);

  const getDataColumns = useCallback(() => {
    const dataColumns = visualizationConfig?.datasetConfig?.dataColumns;
    const selected =
      dataColumns.option === 'all'
        ? sheetContext?.headers
        : dataColumns.selectedColumns;
    return selected;
  }, [visualizationConfig?.datasetConfig?.dataColumns, sheetContext?.headers]);

  return (
    <VisualizationContext.Provider
      value={{
        visualizationConfig,
        setVisualizationConfig,
        sheetContext,
        loadingFile,
        loadingFileError,
        getDataColumns,
      }}
    >
      {children}
    </VisualizationContext.Provider>
  );
};

export const useVisualizationContext = () => useContext(VisualizationContext);
