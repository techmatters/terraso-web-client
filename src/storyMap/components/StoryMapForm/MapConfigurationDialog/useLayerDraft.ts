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

import { useCallback, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { useSelector } from 'terraso-web-client/terrasoApi/store';

import {
  addMapLayerId,
  moveMapLayerId,
  removeMapLayerId,
  resolveMapLayers,
} from 'terraso-web-client/storyMap/mapLayerUtils';
import { fetchDataLayers } from 'terraso-web-client/storyMap/storyMapSlice';
import {
  MapLayerConfig,
  MapLayerDraftRow,
  MapLayerTransition,
} from 'terraso-web-client/storyMap/storyMapTypes';

export type LayerDraftOptions = {
  storyMapId?: string;
  email?: string;
  /**
   * Gate for the layer-index fetch: dialog hosts pass `open`, a persistent
   * (non-dialog) host passes `true`. The fetch/listener wiring is otherwise
   * host-agnostic.
   */
  fetchEnabled: boolean;
  /** The transition's `mapLayers` (legacy chapters pass undefined). */
  mapLayers?: MapLayerTransition[];
  /** The transition's `dataLayerConfigId` (legacy read fallback). */
  dataLayerConfigId?: string;
  /** The config's stored `dataLayers` payload. */
  dataLayers?: Record<string, MapLayerConfig>;
};

/**
 * Ordered layer-id draft for one transition (index 0 = topmost) plus the
 * resolved rows. Pure layer-list state: the draft knows nothing about the
 * derived compat fields (see `syncTransitionLayerFields`) and is written back
 * to the config only by the caller.
 */
export const useLayerDraft = ({
  storyMapId,
  email,
  fetchEnabled,
  mapLayers,
  dataLayerConfigId,
  dataLayers: configDataLayers = {},
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

  // Ordered draft layer ids for this transition (index 0 = topmost).
  const [draftLayerIds, setDraftLayerIds] = useState<string[]>(() =>
    resolveMapLayers({ mapLayers, dataLayerConfigId }).map(
      ({ layerId }) => layerId
    )
  );

  // ONE row array for render → reorder → confirm. Rows keep dangling refs
  // (config null) — unknown data is never silently dropped.
  const draftRows = useMemo<MapLayerDraftRow[]>(
    () =>
      draftLayerIds.map(layerId => ({
        layerId,
        config: resolveLayerConfig(layerId) ?? null,
      })),
    [draftLayerIds, resolveLayerConfig]
  );

  const draftMapLayerConfigs = useMemo(
    () =>
      draftRows
        .map(({ config: mapLayerConfig }) => mapLayerConfig)
        .filter((mapLayerConfig): mapLayerConfig is MapLayerConfig =>
          Boolean(mapLayerConfig)
        ),
    [draftRows]
  );

  return {
    draftLayerIds,
    setDraftLayerIds,
    draftRows,
    draftMapLayerConfigs,
    layerConfigsById,
    resolveLayerConfig,
    fetchedMapLayers,
    fetching,
    error,
    addMapLayerId,
    removeMapLayerId,
    moveMapLayerId,
  };
};
