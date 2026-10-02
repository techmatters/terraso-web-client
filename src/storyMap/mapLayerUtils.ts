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

import logger from 'terraso-client-shared/monitoring/logger';

import {
  generateLayerId,
  getLayerOpacity,
  LAYER_TYPES,
} from 'terraso-web-client/sharedData/visualization/components/VisualizationMapLayer';
import {
  LayerConfig,
  MapLayerConfig,
  MapLayerTransition,
  Transition,
} from 'terraso-web-client/storyMap/storyMapTypes';

/**
 * Resolves a layer id to its full layer configuration (used to regenerate
 * fade events with the correct per-layer-type opacities).
 */
export type LayerConfigResolver = (
  layerId: string
) => MapLayerConfig | undefined;

/**
 * The compat fields derived from `mapLayers` + `dataLayers` (see
 * `syncTransitionLayerFields`).
 */
export type DerivedTransitionLayerFields = Pick<
  Transition,
  'dataLayerConfigId' | 'onChapterEnter' | 'onChapterExit'
>;

/**
 * Ordered layer list for a transition (index 0 = topmost on the map).
 *
 * Read-side fallback: when `mapLayers` is absent (legacy chapters), the
 * single-layer `dataLayerConfigId` is used. `mapLayers` is only written when
 * the user saves the map configuration — legacy chapters are never migrated.
 */
export const resolveMapLayers = (
  transition?: Partial<Transition> | null
): MapLayerTransition[] => {
  if (!transition) {
    return [];
  }
  if (transition.mapLayers !== undefined) {
    return transition.mapLayers;
  }
  return transition.dataLayerConfigId
    ? [{ layerId: transition.dataLayerConfigId }]
    : [];
};

/** Maps an ordered list of layer ids to `Transition.mapLayers` refs. */
export const toMapLayers = (layerIds: string[]): MapLayerTransition[] =>
  layerIds.map(layerId => ({ layerId }));

/**
 * Adds a layer to an ordered layer id list: prepends it (index 0 is topmost),
 * moving an already-present layer to the top instead of duplicating it.
 */
export const addMapLayerId = (
  layerIds: string[],
  layerId: string
): string[] => [layerId, ...layerIds.filter(id => id !== layerId)];

/** Removes a layer from an ordered layer id list. */
export const removeMapLayerId = (
  layerIds: string[],
  layerId: string
): string[] => layerIds.filter(id => id !== layerId);

/**
 * Moves the entry at `sourceIndex` to `destinationIndex` (drag reorder
 * semantics).
 */
export const moveMapLayerId = (
  layerIds: string[],
  sourceIndex: number,
  destinationIndex: number
): string[] => {
  const next = [...layerIds];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(destinationIndex, 0, moved);
  return next;
};

const GENERATED_LAYER_SUFFIXES = Object.values(LAYER_TYPES);

/**
 * Whether a raw `onChapterEnter`/`onChapterExit` entry's `layer` is a
 * generated data-layer sublayer id (`<layerId>-markers` etc.). Generated
 * entries are always regenerated from `mapLayers`; any other entry is
 * hand-authored and preserved on write.
 */
export const isDataLayerSublayerId = (layer: string): boolean =>
  GENERATED_LAYER_SUFFIXES.some(suffix => layer.endsWith(`-${suffix}`));

/**
 * Regenerates the compat `onChapterEnter`/`onChapterExit` fade events for
 * every layer in `mapLayers` (same generation as the legacy single-layer
 * `onDataLayerChange`, applied per layer).
 *
 * Layers whose config cannot be resolved are skipped (with a warning) instead
 * of baking placeholder opacities into the persisted events.
 */
export const generateLayerTransitionEvents = (
  mapLayers: MapLayerTransition[],
  getLayerConfig: LayerConfigResolver = () => undefined
): { onChapterEnter: LayerConfig[]; onChapterExit: LayerConfig[] } => {
  const onChapterEnter: LayerConfig[] = mapLayers.flatMap(({ layerId }) => {
    const layerConfig = getLayerConfig(layerId);
    if (!layerConfig) {
      logger.warn(
        `generateLayerTransitionEvents: no config for layer ${layerId}, skipping its transition events`
      );
      return [];
    }
    return Object.values(LAYER_TYPES).map(name => ({
      layer: generateLayerId(layerId, name),
      opacity: getLayerOpacity(name, layerConfig),
      duration: 0,
    }));
  });

  return {
    onChapterEnter,
    onChapterExit: onChapterEnter.map(event => ({ ...event, opacity: 0 })),
  };
};

/**
 * Derives the compat fields of a transition from `mapLayers` — the single
 * generation point for ALL writers. Returns only the derived fields; spread
 * the result over the transition being written.
 *
 * - `onChapterEnter`/`onChapterExit`: regenerated for ALL layers in
 *   `mapLayers` (stale generated entries are dropped); hand-authored entries
 *   whose `layer` is not a generated data-layer sublayer id are preserved.
 * - `dataLayerConfigId`: points at the most recently added layer (the topmost
 *   newly added one), stays put across reorders/removals of other layers, and
 *   is repointed to the topmost remaining layer (or cleared) when the layer it
 *   pointed at is removed.
 *
 * Returns `{}` for legacy transitions without `mapLayers`: the compat fields
 * are left exactly as they are (read fallback — no load-time migration).
 *
 * `previousTransition` is the transition's state before the write (used to
 * detect which layer was just added).
 */
export const syncTransitionLayerFields = (
  transition: Partial<Transition>,
  getLayerConfig: LayerConfigResolver = () => undefined,
  previousTransition?: Partial<Transition> | null
): Partial<DerivedTransitionLayerFields> => {
  if (transition.mapLayers === undefined) {
    return {};
  }
  const mapLayers = transition.mapLayers;

  const previousLayerIds = new Set(
    resolveMapLayers(previousTransition).map(({ layerId }) => layerId)
  );
  const newlyAdded = mapLayers.find(
    ({ layerId }) => !previousLayerIds.has(layerId)
  );

  const currentLayerIds = mapLayers.map(({ layerId }) => layerId);
  let dataLayerConfigId: string | undefined;
  if (newlyAdded) {
    dataLayerConfigId = newlyAdded.layerId;
  } else if (
    transition.dataLayerConfigId &&
    currentLayerIds.includes(transition.dataLayerConfigId)
  ) {
    dataLayerConfigId = transition.dataLayerConfigId;
  } else {
    dataLayerConfigId = mapLayers[0]?.layerId;
  }

  const generated = generateLayerTransitionEvents(mapLayers, getLayerConfig);
  const preserveHandAuthored = (events?: LayerConfig[]) =>
    (events ?? []).filter(event => !isDataLayerSublayerId(event.layer));

  return {
    dataLayerConfigId,
    onChapterEnter: [
      ...preserveHandAuthored(transition.onChapterEnter),
      ...generated.onChapterEnter,
    ],
    onChapterExit: [
      ...preserveHandAuthored(transition.onChapterExit),
      ...generated.onChapterExit,
    ],
  };
};
