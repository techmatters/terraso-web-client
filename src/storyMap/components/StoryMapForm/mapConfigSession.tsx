/*
 * Copyright © 2026 Technology Matters
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
  useMemo,
  useState,
} from 'react';

import type { MapConfigurationConfirm } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapConfigurationDialog';
import {
  MapLayerTransition,
  MapPosition,
} from 'terraso-web-client/storyMap/storyMapTypes';

/**
 * Which transition (chapter or title) the fullscreen map configuration
 * overlay is editing, plus its confirm callback. Everything else about the
 * overlay (draft layers, camera, create flow) lives inside
 * `MapConfigurationDialog`.
 */
export type MapConfigTarget = {
  location?: MapPosition;
  title?: string;
  chapterId?: string;
  mapLayers?: MapLayerTransition[];
  dataLayerConfigId?: string;
  onConfirm: (_: MapConfigurationConfirm) => void;
};

type MapConfigSessionValue = {
  target: MapConfigTarget | null;
  openMapConfig: (_: MapConfigTarget) => void;
  closeMapConfig: () => void;
};

const MapConfigSessionContext = createContext<MapConfigSessionValue | null>(
  null
);

/**
 * Host-agnostic session for the map configuration overlay: triggers
 * (chapter/title "Edit Map" buttons) call `openMapConfig` with the transition
 * being edited; the form host renders the overlay over the shared editor map.
 * Returns null when no provider is mounted (e.g. the published viewer).
 */
export const useMapConfigSession = () => useContext(MapConfigSessionContext);

export const MapConfigSessionProvider = ({ children }: { children: any }) => {
  const [target, setTarget] = useState<MapConfigTarget | null>(null);

  const openMapConfig = useCallback((newTarget: MapConfigTarget) => {
    setTarget(newTarget);
  }, []);

  const closeMapConfig = useCallback(() => {
    setTarget(null);
  }, []);

  const value = useMemo<MapConfigSessionValue>(
    () => ({ target, openMapConfig, closeMapConfig }),
    [target, openMapConfig, closeMapConfig]
  );

  return (
    <MapConfigSessionContext.Provider value={value}>
      {children}
    </MapConfigSessionContext.Provider>
  );
};
