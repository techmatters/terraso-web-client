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
 * Ordered layer list for a transition (index 0 = topmost on the map).
 *
 * Read-side fallback: when `mapLayers` is absent (legacy chapters), the
 * single-layer `dataLayerConfigId` is used. `mapLayers` is only written when
 * the user saves the map configuration — legacy chapters are never migrated.
 */
export const resolveMapLayers = (
  transition?: Partial<Transition>
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

/**
 * Regenerates the compat `onChapterEnter`/`onChapterExit` fade events for
 * every layer in `mapLayers` (same generation as the legacy single-layer
 * `onDataLayerChange`, applied per layer).
 */
export const generateLayerTransitionEvents = (
  mapLayers: MapLayerTransition[],
  getLayerConfig: LayerConfigResolver = () => undefined
): Pick<Transition, 'onChapterEnter' | 'onChapterExit'> => {
  const onChapterEnter: LayerConfig[] = mapLayers.flatMap(({ layerId }) =>
    Object.values(LAYER_TYPES).map(name => ({
      layer: generateLayerId(layerId, name),
      opacity: getLayerOpacity(name, getLayerConfig(layerId)),
      duration: 0,
    }))
  );

  return {
    onChapterEnter,
    onChapterExit: onChapterEnter.map(event => ({ ...event, opacity: 0 })),
  };
};

/**
 * Adds a layer to a transition: prepends it to `mapLayers` (index 0 is
 * topmost), points `dataLayerConfigId` at the most recently added layer and
 * regenerates the compat fade events for ALL layers.
 */
export const addMapLayerToTransition = <T extends Partial<Transition>>(
  transition: T,
  layerConfig: MapLayerConfig,
  getLayerConfig: LayerConfigResolver = () => undefined
): T => {
  const mapLayers = [
    { layerId: layerConfig.id },
    ...resolveMapLayers(transition).filter(
      ({ layerId }) => layerId !== layerConfig.id
    ),
  ];

  return {
    ...transition,
    ...generateLayerTransitionEvents(mapLayers, layerId =>
      layerId === layerConfig.id ? layerConfig : getLayerConfig(layerId)
    ),
    mapLayers,
    dataLayerConfigId: layerConfig.id,
  } as T;
};

/**
 * Removes a layer from a transition and regenerates the compat fade events for
 * the remaining layers. When `dataLayerConfigId` pointed at the removed layer
 * it is repointed to the remaining topmost layer, or cleared if none remain.
 */
export const removeMapLayerFromTransition = <T extends Partial<Transition>>(
  transition: T,
  layerId: string,
  getLayerConfig: LayerConfigResolver = () => undefined
): T => {
  const mapLayers = resolveMapLayers(transition).filter(
    ({ layerId: id }) => id !== layerId
  );
  const dataLayerConfigId =
    transition.dataLayerConfigId === layerId
      ? mapLayers[0]?.layerId
      : transition.dataLayerConfigId;

  return {
    ...transition,
    ...generateLayerTransitionEvents(mapLayers, getLayerConfig),
    mapLayers,
    dataLayerConfigId,
  } as T;
};

/**
 * Reorders a transition's layers. Only changes `mapLayers` order — it does NOT
 * change `dataLayerConfigId` nor regenerate the compat fade events.
 */
export const reorderTransitionMapLayers = <T extends Partial<Transition>>(
  transition: T,
  mapLayers: MapLayerTransition[]
): T =>
  ({
    ...transition,
    mapLayers,
  }) as T;
