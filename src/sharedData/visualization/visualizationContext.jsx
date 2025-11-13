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
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import _ from 'lodash/fp';
import { useDispatch } from 'react-redux';
import { addMessage } from 'terraso-client-shared/notifications/notificationsSlice';

import { INITIAL_CONFIG } from 'terraso-web-client/sharedData/visualization/components/VisualizationConfigForm/index';
import {
  readDataSetFile,
  readMapFile,
} from 'terraso-web-client/sharedData/visualization/visualizationUtils';

import { MAP_DATA_ACCEPTED_EXTENSIONS } from 'terraso-web-client/config';

export const VisualizationContext = createContext();

export const VisualizationContextProvider = props => {
  const dispatch = useDispatch();
  const {
    visualizationConfig,
    setVisualizationConfig,
    dispatchErrors = true,
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
    setLoadingFileError(undefined);
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
        if (dispatchErrors) {
          dispatch(
            addMessage({
              severity: 'error',
              content: 'sharedData.visualization_file_load_error',
              params: { name: visualizationConfig.selectedFile.name },
            })
          );
        }
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
    dispatchErrors,
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
