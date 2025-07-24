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

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import _ from 'lodash/fp';
import { useDispatch } from 'react-redux';
import { addMessage } from 'terraso-client-shared/notifications/notificationsSlice';

import {
  readDataSetFile,
  readMapFile,
} from 'sharedData/visualization/visualizationUtils';

import { INITIAL_CONFIG } from './components/VisualizationConfigForm';

import { MAP_DATA_ACCEPTED_EXTENSIONS } from 'config';

export const VisualizationContext = React.createContext();

export const VisualizationContextProvider = props => {
  const dispatch = useDispatch();
  const {
    visualizationConfig,
    setVisualizationConfig,
    restrictSourceToOwner = true,
    children,
  } = props;
  const [fileContext, setFileContext] = useState({});
  const [loadingFile, setLoadingFile] = useState(true);
  const [loadingFileError, setLoadingFileError] = useState();
  const [useTileset, setUseTileset] = useState(null);

  const clear = useCallback(() => {
    setVisualizationConfig(INITIAL_CONFIG);
    setFileContext({});
    setLoadingFile(true);
    setLoadingFileError(null);
    setUseTileset(null);
  }, [setVisualizationConfig]);

  const isMapFile = useMemo(() => {
    if (!visualizationConfig.selectedFile) {
      return;
    }
    return _.includes(
      visualizationConfig.selectedFile.resourceType,
      MAP_DATA_ACCEPTED_EXTENSIONS
    );
  }, [visualizationConfig.selectedFile]);

  useEffect(() => {
    if (!visualizationConfig.tilesetId) {
      return;
    }

    setUseTileset(true);
    setLoadingFile(false);
  }, [visualizationConfig.tilesetId]);

  useEffect(() => {
    if (!visualizationConfig.selectedFile || visualizationConfig.tilesetId) {
      return;
    }
    const newFileContext =
      visualizationConfig?.selectedFile?.id !== fileContext?.selectedFile?.id;
    if (!newFileContext) {
      return;
    }
    setLoadingFile(true);
    setFileContext(undefined);
    const readFileRequest = {
      promise: isMapFile
        ? readMapFile(visualizationConfig.selectedFile)
        : readDataSetFile(visualizationConfig.selectedFile),
      valid: true,
    };
    readFileRequest.promise
      .then(fileContext => {
        if (!readFileRequest.valid) {
          return;
        }
        setFileContext({
          ...fileContext,
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
  }, [
    visualizationConfig.selectedFile,
    visualizationConfig.tilesetId,
    fileContext,
    dispatch,
    isMapFile,
  ]);

  const getDataColumns = useCallback(() => {
    const dataColumns = visualizationConfig?.datasetConfig?.dataColumns;
    const selected =
      dataColumns.option === 'all'
        ? fileContext?.headers
        : dataColumns.selectedColumns;
    return selected;
  }, [visualizationConfig?.datasetConfig?.dataColumns, fileContext?.headers]);

  return (
    <VisualizationContext.Provider
      value={{
        visualizationConfig,
        setVisualizationConfig,
        restrictSourceToOwner,
        fileContext,
        loadingFile,
        loadingFileError,
        getDataColumns,
        useTileset,
        isMapFile,
        clear,
      }}
    >
      {children}
    </VisualizationContext.Provider>
  );
};

export const useVisualizationContext = () => useContext(VisualizationContext);
