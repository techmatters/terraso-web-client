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

import { useEffect, useMemo, useRef } from 'react';
import bbox from '@turf/bbox';
import _ from 'lodash/fp';

import GeoJsonSource from 'terraso-web-client/gis/components/GeoJsonSource';
import { useMap } from 'terraso-web-client/gis/components/Map';
import {
  announceFitIntent,
  fitMapBounds,
  isProgrammaticMove,
  resetProgrammaticMove,
} from 'terraso-web-client/gis/mapCamera';
import VisualizationMapLayer from 'terraso-web-client/sharedData/visualization/components/VisualizationMapLayer';
import { sheetToGeoJSON } from 'terraso-web-client/sharedData/visualization/visualizationUtils';
import {
  MAP_LAYER_CREATE_PREVIEW_ID,
  MapLayerCreateSession,
  useMapLayerCreateSession,
} from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerCreateSession';
import { StoryMapLayer } from 'terraso-web-client/storyMap/components/StoryMapLayer';
import { enforceMapLayerOrder } from 'terraso-web-client/storyMap/mapUtils';
import {
  MapBounds,
  MapLayerConfig,
  MapLayerTransition,
  MapPosition,
} from 'terraso-web-client/storyMap/storyMapTypes';

const CREATE_PREVIEW_MAP_LAYERS: MapLayerTransition[] = [
  { layerId: MAP_LAYER_CREATE_PREVIEW_ID },
];
const NO_MAP_LAYERS: MapLayerTransition[] = [];

const USER_INTERACTION_EVENTS = [
  'dragstart',
  'mousedown',
  'touchstart',
  'wheel',
] as const;

/**
 * Records user camera moves (chapter location editing). Programmatic moves —
 * fits through the shared `fitMapBounds` helper (layer previews, create
 * preview) — are announced automatically and skipped (mapCamera protocol),
 * so they never rewrite the chapter camera. Real user interaction always
 * ends the suppression.
 */
export const MapLocationChange = ({
  onPositionChange,
}: {
  onPositionChange: (position: MapPosition) => void;
}) => {
  const { map } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }
    const updatePosition = () => {
      if (isProgrammaticMove(map)) {
        return;
      }
      onPositionChange({
        center: map.getCenter(),
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
        bounds: _.flatten(map.getBounds().toArray()) as MapBounds,
      });
    };
    const onUserInteraction = () => {
      resetProgrammaticMove(map);
    };
    map.on('load', updatePosition);
    map.on('move', updatePosition);
    USER_INTERACTION_EVENTS.forEach(event => map.on(event, onUserInteraction));

    return () => {
      map.off('load', updatePosition);
      map.off('move', updatePosition);
      USER_INTERACTION_EVENTS.forEach(event =>
        map.off(event, onUserInteraction)
      );
    };
  }, [map, onPositionChange]);

  return null;
};

const MapLayerCreatePreviewContent = ({
  session,
}: {
  session: MapLayerCreateSession;
}) => {
  const { map } = useMap();
  const {
    visualizationConfig,
    fileContext,
    isMapFile,
    loadingFile,
    loadingFileError,
  } = session;
  const selectedFile = visualizationConfig.selectedFile;

  const geoJson = useMemo<any>(() => {
    if (loadingFile || loadingFileError || !fileContext) {
      return null;
    }
    // Defense in depth: only ever preview data that belongs to the session's
    // selected file.
    if (fileContext.selectedFile?.id !== selectedFile?.id) {
      return null;
    }
    return isMapFile
      ? fileContext.geojson
      : sheetToGeoJSON(fileContext, visualizationConfig);
  }, [
    loadingFile,
    loadingFileError,
    fileContext,
    selectedFile,
    isMapFile,
    visualizationConfig,
  ]);

  // Fit the map to the previewed data ONCE per session (like the old create
  // dialog's preview map did) — configuration changes must not steal the
  // camera. The one-shot is armed only AFTER a successful fit: a dataset
  // (CSV) file yields no geometry until the form maps its coordinate columns,
  // and the fit must still happen when the first non-empty geometry arrives.
  const fittedRef = useRef(false);
  useEffect(() => {
    if (!map || !geoJson || fittedRef.current) {
      return;
    }
    let bounds: [[number, number], [number, number]];
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
    // Shared fit helper: the camera move is announced automatically, so it
    // is never recorded as a user camera edit.
    fitMapBounds(map, bounds, { animate: false });
    fittedRef.current = true;
  }, [map, geoJson]);

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
      />
    </>
  );
};

/**
 * Live preview of the map layer being created, rendered on the HOST map on
 * top of the chapter's other layers. Renders nothing until the session's
 * uploaded file is parsed; updates as the visualization config changes.
 * Takes ZERO host callbacks: camera suppression and z-order are automatic
 * (shared fit helper + `MapLayerPreview`'s internal ordering).
 */
export const MapLayerCreatePreview = () => {
  const session = useMapLayerCreateSession();
  if (!session?.creating) {
    return null;
  }
  // Keyed by session: the whole preview (including its one-shot fit) is a
  // per-session unit and resets wholesale when a new session starts.
  return (
    <MapLayerCreatePreviewContent key={session.sessionId} session={session} />
  );
};

/**
 * Renders the draft layers on the preview map (topmost first) and keeps the
 * mapbox z-order in sync with the draft order. The create preview is stacked
 * ABOVE the draft layers while a creation is in progress — entirely
 * internally; hosts pass no ids, no children and no revision callbacks.
 */
export const MapLayerPreview = ({
  mapLayerConfigs,
  changeBoundsLayerId,
}: {
  mapLayerConfigs: MapLayerConfig[];
  changeBoundsLayerId?: string;
}) => {
  const session = useMapLayerCreateSession();
  const { map } = useMap();
  const creating = session?.creating ?? false;

  const mapLayers = useMemo<MapLayerTransition[]>(
    () => [
      ...(creating ? CREATE_PREVIEW_MAP_LAYERS : NO_MAP_LAYERS),
      ...mapLayerConfigs.map(({ id }) => ({ layerId: id })),
    ],
    [creating, mapLayerConfigs]
  );

  // Fit intent for the layer the host asked to fit: its bounds resolve
  // async (source fetches) and the fit may fire late or never — the whole
  // window is announced so the camera move it may cause is never recorded as
  // a user edit (mapCamera protocol; hosts announce nothing themselves).
  useEffect(() => {
    if (!map || !changeBoundsLayerId) {
      return;
    }
    return announceFitIntent(map);
  }, [map, changeBoundsLayerId]);

  useEffect(() => {
    if (!map) {
      return;
    }
    const enforce = () => {
      enforceMapLayerOrder(map, mapLayers);
    };
    enforce();
    // Self-healing z-order: generated sublayers land asynchronously (marker
    // images, tileset fetches), so re-enforce whenever a layer joins the map.
    // Hosts therefore never thread onLayerAdded/revision callbacks.
    map.on('layeradd', enforce);
    return () => {
      map.off('layeradd', enforce);
    };
  }, [map, mapLayers]);

  return (
    <>
      {mapLayerConfigs.map(mapLayerConfig => (
        <StoryMapLayer
          key={mapLayerConfig.id}
          config={mapLayerConfig}
          useConfigBounds
          changeBounds={mapLayerConfig.id === changeBoundsLayerId}
          avoidMoveWhenVisible
        />
      ))}
      {/* Rendered last so mapbox inserts it on top of the draft layers. */}
      <MapLayerCreatePreview />
    </>
  );
};
