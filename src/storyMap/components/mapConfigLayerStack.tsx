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

import { createContext, useContext } from 'react';

import {
  MapLayerConfig,
  MapLayerTransition,
} from 'terraso-web-client/storyMap/storyMapTypes';

/**
 * The map configuration overlay's DRAFT layer stack, published upward to the
 * map host (`StoryMap`) that owns the one-and-only mount point per mapbox
 * layer id. The draft is a different DATASET feeding the same mounts: while
 * the overlay is open, the host renders these configs instead of the
 * config's `dataLayers` — never alongside them (two mounts of one layer id
 * fight over the global mapbox id and refetch the GeoJSON on every
 * open/cancel).
 */
export type MapConfigLayerStack = {
  /** Resolved draft layer configs (dangling refs are not resolvable here). */
  configs: MapLayerConfig[];
  /** Draft order, index 0 topmost (only resolvable configs). */
  order: MapLayerTransition[];
  /** Layer to fit the map to (just added/created in the draft). */
  changeBoundsLayerId?: string;
};

type PublishLayerStack = (_: MapConfigLayerStack | null) => void;

const noop = () => {};

const MapConfigLayerStackContext = createContext<PublishLayerStack>(noop);

export const MapConfigLayerStackProvider = MapConfigLayerStackContext.Provider;

/**
 * The overlay calls this with its current draft stack (and `null` when its
 * session ends). Hosts that do not host the overlay over a shared map (the
 * standalone tests) keep the default no-op.
 */
export const usePublishMapConfigLayerStack = () =>
  useContext(MapConfigLayerStackContext);
