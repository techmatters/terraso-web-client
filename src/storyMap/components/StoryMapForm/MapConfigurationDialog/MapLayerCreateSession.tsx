/*
 * Copyright © 2025 Technology Matters
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

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import bbox from '@turf/bbox';
import { DataEntryNode } from 'terraso-web-client/terrasoApi/shared/graphqlSchema/graphql';

import GeoJsonSource from 'terraso-web-client/gis/components/GeoJsonSource';
import { useMap } from 'terraso-web-client/gis/components/Map';
import VisualizationMapLayer from 'terraso-web-client/sharedData/visualization/components/VisualizationMapLayer';
import {
  useVisualizationContext,
  VisualizationContextProvider,
} from 'terraso-web-client/sharedData/visualization/visualizationContext';
import { sheetToGeoJSON } from 'terraso-web-client/sharedData/visualization/visualizationUtils';
import { VisualizationConfigForm } from 'terraso-web-client/storyMap/storyMapTypes';

import theme from 'terraso-web-client/theme';

/**
 * Source/layer id of the preview layer for the map layer being created. The
 * host map stacks its generated sublayers ABOVE every other layer (see
 * `MapLayerPreview`'s `topLayerIds`) while a creation is in progress.
 */
export const MAP_LAYER_CREATE_PREVIEW_ID = 'map-layer-create-preview';

const createInitialVisualizationConfig = (): VisualizationConfigForm => ({
  selectedFile: undefined as DataEntryNode | undefined,
  visualizeConfig: {
    shape: 'circle',
    size: 15,
    color: theme.palette.visualization.markerDefaultColor,
    opacity: 50,
  },
  annotateConfig: {
    dataPoints: [],
  },
});

type MapLayerCreateSessionProviderProps = {
  /**
   * The file that started the create session (picked or dropped). A change
   * starts a NEW session: the visualization draft is reset so nothing leaks
   * from a previous (finished or cancelled) creation.
   */
  file?: File;
  children: ReactNode;
};

/**
 * Holds the create-session state (the layer's visualization config draft) and
 * provides it to the create steps (sidebar) and the create preview (host map).
 * Host-agnostic: the same provider backs the map configuration dialog and a
 * persistent (non-dialog) sidebar.
 */
export const MapLayerCreateSessionProvider = ({
  file,
  children,
}: MapLayerCreateSessionProviderProps) => {
  const [visualizationConfig, setVisualizationConfig] =
    useState<VisualizationConfigForm>(createInitialVisualizationConfig);

  // New session (new file) → reset the draft during render, so the first
  // render of the new session never sees the previous session's selections.
  const sessionFileRef = useRef(file);
  if (sessionFileRef.current !== file) {
    sessionFileRef.current = file;
    setVisualizationConfig(createInitialVisualizationConfig());
  }

  return (
    <VisualizationContextProvider
      visualizationConfig={visualizationConfig}
      setVisualizationConfig={setVisualizationConfig}
      dispatchErrors={false}
    >
      {children}
    </VisualizationContextProvider>
  );
};

/**
 * Live preview of the map layer being created, rendered on the HOST map on
 * top of the chapter's other layers. Renders nothing until the session's
 * uploaded file is parsed; updates as the visualization config changes.
 */
export const MapLayerCreatePreview = ({
  onLayerAdded,
  onFitBounds,
}: {
  onLayerAdded?: (layerId: string) => void;
  /** Called just before the preview fits the map to its data (camera fits). */
  onFitBounds?: () => void;
}) => {
  const {
    visualizationConfig,
    fileContext,
    isMapFile,
    loadingFile,
    loadingFileError,
  } = useVisualizationContext();
  const { map } = useMap();

  const geoJson = useMemo(() => {
    if (loadingFile || loadingFileError || !fileContext) {
      return null;
    }
    return isMapFile
      ? fileContext.geojson
      : sheetToGeoJSON(fileContext, visualizationConfig);
  }, [
    loadingFile,
    loadingFileError,
    fileContext,
    isMapFile,
    visualizationConfig,
  ]);

  // Fit the map to the previewed data ONCE per session (like the old create
  // dialog's preview map did) — configuration changes must not steal the
  // camera. The fit is announced so the host can suppress camera recording.
  const fittedRef = useRef(false);
  useEffect(() => {
    if (!map || !geoJson || fittedRef.current) {
      return;
    }
    fittedRef.current = true;
    let bounds;
    try {
      const [minX, minY, maxX, maxY] = bbox(geoJson);
      if (![minX, minY, maxX, maxY].every(Number.isFinite)) {
        return;
      }
      bounds = [
        [minX, minY],
        [maxX, maxY],
      ];
    } catch {
      return;
    }
    onFitBounds?.();
    map.fitBounds(bounds, { animate: false });
  }, [map, geoJson, onFitBounds]);

  if (!geoJson) {
    return null;
  }

  return (
    <>
      <GeoJsonSource id={MAP_LAYER_CREATE_PREVIEW_ID} geoJson={geoJson} />
      <VisualizationMapLayer
        sourceName={MAP_LAYER_CREATE_PREVIEW_ID}
        visualizationConfig={visualizationConfig}
        showPopups={false}
        isMapFile={isMapFile}
        // Bounds are handled above (once per session), never on config change.
        changeBounds={false}
        onLayerAdded={onLayerAdded}
      />
    </>
  );
};
