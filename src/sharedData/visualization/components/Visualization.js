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
import React, { useMemo } from 'react';

import './Visualization.css';

import GeoJsonSource from 'gis/components/GeoJsonSource';
import Map from 'gis/components/Map';
import MapControls from 'gis/components/MapControls';
import MapLoader from 'gis/components/MapLoader';
import MapStyleSwitcher from 'gis/components/MapStyleSwitcher';
import MapboxLayer from 'sharedData/visualization/components/VisualizationMapLayer';
import MapboxRemoteSource from 'sharedData/visualization/components/VisualizationMapRemoteSource';
import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';

import { sheetToGeoJSON } from '../visualizationUtils';

const MAP_PADDING = {
  top: 50,
  bottom: 50,
  left: 50,
  right: 50,
};

const FileContextSource = props => {
  const { visualizationConfig, sampleSize } = props;
  const { fileContext, isMapFile } = useVisualizationContext();

  const geoJson = useMemo(
    () =>
      isMapFile
        ? fileContext.geojson
        : sheetToGeoJSON(fileContext, visualizationConfig, sampleSize),
    [isMapFile, fileContext, visualizationConfig, sampleSize]
  );

  return (
    <GeoJsonSource
      id="visualization"
      geoJson={geoJson}
      fitGeoJsonBounds={!visualizationConfig?.viewportConfig?.bounds}
    />
  );
};

const Visualization = props => {
  const {
    customConfig,
    showPopup = false,
    sampleSize,
    onBoundsChange,
    onStyleChange,
    useConfigBounds,
    children,
  } = props;
  const visualizationContext = useVisualizationContext();
  const { useTileset, isMapFile, loadingFile } = visualizationContext;

  const visualizationConfig = useMemo(
    () => ({
      ...visualizationContext.visualizationConfig,
      ...customConfig,
    }),
    [customConfig, visualizationContext.visualizationConfig]
  );

  if (loadingFile) {
    return <MapLoader height={400} />;
  }

  return (
    <>
      <Map
        disableRotation
        disableElevation
        projection="mercator"
        mapStyle={visualizationConfig?.viewportConfig?.baseMapStyle}
        onBoundsChange={onBoundsChange}
        onStyleChange={onStyleChange}
        padding={MAP_PADDING}
        sx={{
          width: '100%',
          height: '400px',
        }}
      >
        <MapControls />
        <MapStyleSwitcher />
        {!visualizationContext.loadingFile && (
          <>
            {useTileset ? (
              <MapboxRemoteSource
                sourceName="visualization"
                visualizationConfig={visualizationConfig}
              />
            ) : (
              visualizationContext.fileContext && (
                <FileContextSource
                  visualizationConfig={visualizationConfig}
                  sampleSize={sampleSize}
                />
              )
            )}
            <MapboxLayer
              sourceName="visualization"
              visualizationConfig={visualizationConfig}
              showPopup={isMapFile ? false : showPopup}
              useConfigBounds={useConfigBounds}
              useTileset={useTileset}
              isMapFile={isMapFile}
            />
          </>
        )}

        {children}
      </Map>
    </>
  );
};

export default Visualization;
