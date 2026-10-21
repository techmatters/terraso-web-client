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

import { useCallback, useMemo } from 'react';
import _ from 'lodash/fp';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { useSelector } from 'terraso-web-client/terrasoApi/store';

import { fetchDataLayers } from 'terraso-web-client/storyMap/storyMapSlice';
import { MapLayerConfig } from 'terraso-web-client/storyMap/storyMapTypes';

export type LayerDraftOptions = {
  storyMapId?: string;
  email?: string;
  /**
   * Gate for the layer-index fetch: dialog hosts pass `open`, a persistent
   * (non-dialog) host passes `true`. The fetch/listener wiring is otherwise
   * host-agnostic.
   */
  fetchEnabled: boolean;
  /** The config's stored `dataLayers` payload. */
  dataLayers?: Record<string, MapLayerConfig>;
};

/**
 * The layer INDEX for the layer tree: the fetched layer configs merged with
 * the stored `dataLayers` payload, plus `resolveLayerConfig`.
 *
 * This hook owns NO layer-list state — the active transition's `mapLayers`
 * (the config) is the single source of truth for a step's ordered layer
 * list; hosts derive their rows from it and write through `updateTransition`
 * (immediate apply).
 */
// Stable empty payload: a destructuring default of `{}` would mint a new
// object every render (legacy configs have no `dataLayers`), churning every
// memo downstream of it — the host's layer-stack publish effect then loops
// (publish → host render → context churn → host render → new `{}` → …).
const EMPTY_DATA_LAYERS: Record<string, MapLayerConfig> = {};

export const useLayerDraft = ({
  storyMapId,
  email,
  fetchEnabled,
  dataLayers: configDataLayers = EMPTY_DATA_LAYERS,
}: LayerDraftOptions) => {
  useFetchData(
    useCallback(() => {
      if (fetchEnabled && storyMapId) {
        return fetchDataLayers({
          ownerId: storyMapId,
          // Must always pass a string: django-filter skips the filter when the
          // arg is null, which would return ALL groups/landscapes.
          email: email ?? '',
        });
      }
      return null;
    }, [fetchEnabled, storyMapId, email])
  );

  const fetchedMapLayers = useSelector(
    (state: any) => state.storyMap.dataLayers.list
  ) as MapLayerConfig[];
  const fetching = useSelector(
    (state: any) => state.storyMap.dataLayers.fetching
  ) as boolean;
  const error = useSelector(
    (state: any) => state.storyMap.dataLayers.error
  ) as boolean;

  // Known layer configs: stored entries (`dataLayers` payload) plus everything
  // fetched for the layer tree. Stored entries are the render/persisted shape;
  // owner/title metadata is resolved by id from the fetched index so it never
  // goes stale (stored entries are whitelisted to schema fields on write). A
  // layer absent from the fetched index (e.g. created in this session) keeps
  // its stored shape — without owner metadata the tree files it under
  // "this story map".
  const layerConfigsById = useMemo(() => {
    const merged: Record<string, MapLayerConfig> = {};
    const fetchedById = _.keyBy('id', fetchedMapLayers) as Record<
      string,
      MapLayerConfig
    >;
    Object.values(configDataLayers).forEach(storedConfig => {
      const fetchedConfig = fetchedById[storedConfig.id];
      merged[storedConfig.id] = fetchedConfig
        ? {
            ...storedConfig,
            ..._.pick(
              ['ownerType', 'ownerId', 'ownerName', 'title', 'description'],
              fetchedConfig
            ),
          }
        : storedConfig;
    });
    fetchedMapLayers.forEach(mapLayerConfig => {
      if (!merged[mapLayerConfig.id]) {
        merged[mapLayerConfig.id] = mapLayerConfig;
      }
    });
    return merged;
  }, [fetchedMapLayers, configDataLayers]);

  const resolveLayerConfig = useCallback(
    (layerId: string) => layerConfigsById[layerId],
    [layerConfigsById]
  );

  return {
    layerConfigsById,
    resolveLayerConfig,
    fetchedMapLayers,
    fetching,
    error,
  };
};
