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
  useMemo,
  useRef,
  useState,
} from 'react';
import _ from 'lodash/fp';
import { flushSync } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';

import { syncTransitionLayerFields } from 'terraso-web-client/storyMap/mapLayerUtils';

const StoryMapConfigDataContext = createContext();
const StoryMapPreviewContext = createContext();
const StoryMapMediaContext = createContext();
const StoryMapConfigActionsContext = createContext();
const StoryMapBufferedChapterActionsContext = createContext();
const StoryMapSaveContext = createContext();

const createConfigSnapshot = (config, revision) => ({
  config,
  revision,
});

const resolveConfigUpdate = (currentConfig, nextConfigSetter) =>
  typeof nextConfigSetter === 'function'
    ? nextConfigSetter(currentConfig)
    : nextConfigSetter;

const transitionDataLayerIds = transition =>
  [
    transition?.dataLayerConfigId,
    ...(transition?.mapLayers ?? []).map(({ layerId }) => layerId),
  ].filter(Boolean);

// Fields of a data layer that may be stored in the story map configuration.
// Mirrors the backend's story map config schema (config_validation.py):
// anything else (e.g. `dataEntry`, owner identity used for the layer tree) is
// runtime-only and would be rejected on save. Owner/title metadata is
// resolved from the fetched layer index at render time (see the dialog's
// layerConfigsById merge), never persisted.
const STORED_DATA_LAYER_FIELDS = [
  'id',
  'readableId',
  'title',
  'description',
  'slug',
  'createdAt',
  'createdBy',
  'mapboxTilesetId',
  'mapboxTilesetStatus',
  'tilesetId',
  'geojsonSignedUrl',
  'ownerType',
  'visualizeConfig',
  'annotateConfig',
  'datasetConfig',
  'viewportConfig',
];

// Allowed nested shape of the stored config fields, mirroring the backend
// validators (config_validation.py: DATA_LAYER_FIELDS). `null` keeps the
// value as-is; an array picks those keys; an object recurses.
const STORED_DATA_LAYER_NESTED_FIELDS = {
  createdBy: ['id', 'firstName', 'lastName'],
  visualizeConfig: ['shape', 'opacity', 'size', 'color'],
  annotateConfig: ['dataPoints', 'mapTitle', 'annotationTitle'],
  datasetConfig: ['latitude', 'longitude', 'dataColumns'],
  viewportConfig: {
    bounds: {
      northEast: ['lat', 'lng'],
      southWest: ['lat', 'lng'],
    },
    baseMapStyle: null,
  },
};

const sanitizeNested = (value, shape) => {
  if (!_.isPlainObject(value)) {
    return value;
  }
  const sanitized = Array.isArray(shape)
    ? _.pick(shape, value)
    : Object.keys(shape).reduce(
        (acc, key) =>
          value[key] === undefined || value[key] === null
            ? acc
            : { ...acc, [key]: sanitizeNested(value[key], shape[key]) },
        {}
      );
  // STRUCTURAL SHARING: an already-sanitized value comes back as the SAME
  // object. Rebuilding deep-equal objects on every write churns the identity
  // of nested map layer configs (e.g. `viewportConfig.bounds`), which the
  // layer fit effect keys on — every write then re-ran the bounds fit.
  return _.isEqual(sanitized, value) ? value : sanitized;
};

/**
 * Reduces a data layer entry to the schema-valid stored shape (top-level
 * whitelist + deep sanitization of the nested config fields).
 *
 * STRUCTURAL SHARING: returns the input object when the sanitized shape is
 * deep-equal to it (see {@link sanitizeNested}).
 */
export const sanitizeDataLayerConfig = mapLayerConfig => {
  const sanitized = _.pick(STORED_DATA_LAYER_FIELDS, mapLayerConfig);
  const withNestedFields = Object.keys(STORED_DATA_LAYER_NESTED_FIELDS).reduce(
    (acc, field) =>
      acc[field] === undefined || acc[field] === null
        ? acc
        : {
            ...acc,
            [field]: sanitizeNested(
              acc[field],
              STORED_DATA_LAYER_NESTED_FIELDS[field]
            ),
          },
    sanitized
  );
  return _.isEqual(withNestedFields, mapLayerConfig)
    ? mapLayerConfig
    : withNestedFields;
};

/**
 * `_.mapValues` with structural sharing: returns the input object when every
 * mapped value is unchanged.
 */
const mapValuesShared = (fn, object) => {
  let changed = false;
  const result = Object.keys(object).reduce((acc, key) => {
    const nextValue = fn(object[key]);
    changed = changed || nextValue !== object[key];
    acc[key] = nextValue;
    return acc;
  }, {});
  return changed ? result : object;
};

/**
 * `_.map` with structural sharing: returns the input array when every mapped
 * item is unchanged.
 */
const mapShared = (fn, array) => {
  let changed = false;
  const result = array.map(item => {
    const nextItem = fn(item);
    changed = changed || nextItem !== item;
    return nextItem;
  });
  return changed ? result : array;
};

/**
 * Spreads `patch` over `target`, returning `target` itself when every patched
 * value is deep-equal to the one it replaces.
 */
const mergeIfChanged = (target, patch) => {
  const changed = Object.keys(patch).some(
    key => !_.isEqual(patch[key], target[key])
  );
  return changed ? { ...target, ...patch } : target;
};

/**
 * Garbage-collects data layers no transition references (anymore) and
 * sanitizes the remaining entries to the stored schema shape.
 *
 * COMMIT CONTRACT: this runs at the SAVE/PUBLISH boundary only — never on
 * every update — so removing a layer from a chapter never destroys it mid
 * edit. `options.keepLayerIds` exempts session-created layers (registered by
 * the map configuration dialog's create flow): a just-created layer stays
 * available even when removed from its chapter before saving.
 */
export const pruneUnusedDataLayers = (nextConfig, options = {}) => {
  const keepLayerIds = new Set(options.keepLayerIds ?? []);
  const referencedDataLayerIds = _.uniq([
    ...transitionDataLayerIds(nextConfig.titleTransition),
    ...nextConfig.chapters.flatMap(transitionDataLayerIds),
  ]);

  const dataLayers = {};
  [...referencedDataLayerIds, ...keepLayerIds].forEach(layerId => {
    const mapLayerConfig = nextConfig.dataLayers?.[layerId];
    if (mapLayerConfig) {
      dataLayers[layerId] = sanitizeDataLayerConfig(mapLayerConfig);
    }
  });

  return {
    ...nextConfig,
    dataLayers,
  };
};

/**
 * Syncs the derived compat fields (dataLayerConfigId + onChapterEnter/Exit)
 * of every transition that has `mapLayers` (see `syncTransitionLayerFields` —
 * the single generation point) and sanitizes the `dataLayers` entries. Legacy
 * transitions without `mapLayers` are left untouched.
 */
export const syncConfigLayerFields = (nextConfig, previousConfig) => {
  const layerConfigsById = nextConfig.dataLayers ?? {};
  const syncTransition = (transition, previousTransition) => {
    if (!transition) {
      return transition;
    }
    const derived = syncTransitionLayerFields(
      transition,
      layerId => layerConfigsById[layerId],
      previousTransition
    );
    return Object.keys(derived).length > 0
      ? mergeIfChanged(transition, derived)
      : transition;
  };

  return {
    ...nextConfig,
    ...(nextConfig.dataLayers
      ? {
          dataLayers: mapValuesShared(
            sanitizeDataLayerConfig,
            nextConfig.dataLayers
          ),
        }
      : {}),
    chapters: mapShared(
      chapter =>
        syncTransition(
          chapter,
          previousConfig?.chapters?.find(({ id }) => id === chapter.id)
        ),
      nextConfig.chapters ?? []
    ),
    ...(nextConfig.titleTransition
      ? {
          titleTransition: syncTransition(
            nextConfig.titleTransition,
            previousConfig?.titleTransition
          ),
        }
      : {}),
  };
};

const applyConfigUpdate = (currentConfig, nextConfigSetter) => {
  const nextConfig = resolveConfigUpdate(currentConfig, nextConfigSetter);

  return syncConfigLayerFields(nextConfig, currentConfig);
};

export const StoryMapConfigContextProvider = props => {
  const { children, baseConfig, storyMap } = props;
  if (baseConfig === undefined || baseConfig === null) {
    throw new Error('StoryMapConfigContextProvider requires a baseConfig');
  }

  const initialConfig = baseConfig;
  const [config, setConfig] = useState(initialConfig);
  const [configRevision, setConfigRevision] = useState(0);
  const [preview, setPreview] = useState(false);
  const [mediaFiles, setMediaFiles] = useState({});
  const [isConfigDirty, setIsConfigDirty] = useState(false);
  const [hasBufferedChapterChanges, setHasBufferedChapterChanges] =
    useState(false);
  const init = useRef(false);
  const latestConfigRef = useRef(initialConfig);
  const latestConfigRevisionRef = useRef(0);
  // Layers created through the create flow in this editing session: exempt
  // from save-time pruning (see the commit contract on pruneUnusedDataLayers).
  const sessionDataLayerIdsRef = useRef(new Set());
  const bufferedChapterUpdateBuildersRef = useRef(new Map());
  const chaptersWithBufferedChangesRef = useRef(new Set());

  const commitConfigSnapshot = useCallback(
    (nextConfig, shouldMarkDirty = true) => {
      if (_.isEqual(nextConfig, latestConfigRef.current)) {
        return createConfigSnapshot(
          latestConfigRef.current,
          latestConfigRevisionRef.current
        );
      }

      const nextRevision = latestConfigRevisionRef.current + 1;
      latestConfigRef.current = nextConfig;
      latestConfigRevisionRef.current = nextRevision;
      setConfig(nextConfig);
      setConfigRevision(nextRevision);
      setIsConfigDirty(shouldMarkDirty);

      return createConfigSnapshot(nextConfig, nextRevision);
    },
    []
  );

  const getLatestConfigSnapshot = useCallback(
    () =>
      createConfigSnapshot(
        latestConfigRef.current,
        latestConfigRevisionRef.current
      ),
    []
  );

  const addMediaFile = useCallback((content, file) => {
    const id = uuidv4();
    setMediaFiles(prev => ({ ...prev, [id]: { content, file } }));
    return id;
  }, []);

  const clearMediaFiles = useCallback(() => {
    setMediaFiles({});
  }, []);

  const getMediaFile = useCallback(id => mediaFiles[id]?.content, [mediaFiles]);

  const isCurrentRevision = useCallback(
    revision => revision === latestConfigRevisionRef.current,
    []
  );

  const markRevisionSaved = useCallback(
    revision => {
      if (!isCurrentRevision(revision)) {
        return;
      }

      setIsConfigDirty(false);
    },
    [isCurrentRevision]
  );

  const applySavedRevisionConfig = useCallback(
    (revision, savedConfig) => {
      if (!isCurrentRevision(revision)) {
        return false;
      }

      const nextConfig = savedConfig
        ? applyConfigUpdate(latestConfigRef.current, savedConfig)
        : latestConfigRef.current;
      latestConfigRef.current = nextConfig;
      setConfig(nextConfig);
      clearMediaFiles();
      setIsConfigDirty(false);

      return true;
    },
    [clearMediaFiles, isCurrentRevision]
  );

  const updateConfig = useCallback(
    (nextConfigSetter, shouldMarkDirty = true) => {
      const nextConfig = applyConfigUpdate(
        latestConfigRef.current,
        nextConfigSetter
      );
      commitConfigSnapshot(nextConfig, shouldMarkDirty);
    },
    [commitConfigSnapshot]
  );

  const registerSessionDataLayers = useCallback(layerIds => {
    layerIds.forEach(layerId => sessionDataLayerIdsRef.current.add(layerId));
  }, []);

  /**
   * The ONE sanctioned writer of `config.style`: the map style switcher
   * applies the style to the LIVE map (keeping its sources/layers) and then
   * persists it here. Style writes through raw `setConfig` leave the
   * rendered map diverged from the config (StoryMap asserts on that).
   */
  const updateStyle = useCallback(
    style => {
      updateConfig(_.set('style', style));
    },
    [updateConfig]
  );

  // Save/publish boundary: the ONLY place data layers are garbage-collected
  // (session-created layers are exempt).
  const getConfigForSave = useCallback(
    config =>
      pruneUnusedDataLayers(config, {
        keepLayerIds: sessionDataLayerIdsRef.current,
      }),
    []
  );

  const setChapterHasBufferedChanges = useCallback(
    (chapterId, hasBufferedChanges) => {
      const chaptersWithBufferedChanges =
        chaptersWithBufferedChangesRef.current;
      const isAlreadyTracked = chaptersWithBufferedChanges.has(chapterId);

      if (isAlreadyTracked === hasBufferedChanges) {
        return;
      }

      if (hasBufferedChanges) {
        chaptersWithBufferedChanges.add(chapterId);
      } else {
        chaptersWithBufferedChanges.delete(chapterId);
      }

      setHasBufferedChapterChanges(chaptersWithBufferedChanges.size > 0);
    },
    []
  );

  const registerBufferedChapterUpdateBuilder = useCallback(
    (chapterId, buildBufferedChapterUpdate) => {
      bufferedChapterUpdateBuildersRef.current.set(
        chapterId,
        buildBufferedChapterUpdate
      );

      return () => {
        bufferedChapterUpdateBuildersRef.current.delete(chapterId);
      };
    },
    []
  );

  const collectBufferedChapterConfigUpdate = useCallback(
    () =>
      Array.from(bufferedChapterUpdateBuildersRef.current.values()).reduce(
        (collectedUpdate, buildBufferedChapterUpdate) => {
          const configUpdater = buildBufferedChapterUpdate();
          if (!configUpdater) {
            return collectedUpdate;
          }

          return {
            hasChanges: true,
            nextConfig: applyConfigUpdate(
              collectedUpdate.nextConfig,
              configUpdater
            ),
          };
        },
        {
          hasChanges: false,
          nextConfig: latestConfigRef.current,
        }
      ),
    []
  );

  const flushBufferedChapterEdits = useCallback(
    (shouldMarkDirty = true) => {
      const { hasChanges, nextConfig } = collectBufferedChapterConfigUpdate();

      if (!hasChanges) {
        return getLatestConfigSnapshot();
      }

      let nextConfigSnapshot;
      flushSync(() => {
        nextConfigSnapshot = commitConfigSnapshot(nextConfig, shouldMarkDirty);
      });

      return nextConfigSnapshot;
    },
    [
      collectBufferedChapterConfigUpdate,
      commitConfigSnapshot,
      getLatestConfigSnapshot,
    ]
  );

  const isDirty = isConfigDirty || hasBufferedChapterChanges;

  const configDataContextValue = useMemo(
    () => ({
      storyMap,
      config,
      configRevision,
    }),
    [storyMap, config, configRevision]
  );

  const previewContextValue = useMemo(
    () => ({
      preview,
      setPreview,
    }),
    [preview]
  );

  const mediaContextValue = useMemo(
    () => ({
      mediaFiles,
      addMediaFile,
      getMediaFile,
      clearMediaFiles,
    }),
    [mediaFiles, addMediaFile, getMediaFile, clearMediaFiles]
  );

  const configActionsContextValue = useMemo(
    () => ({
      setConfig: updateConfig,
      updateStyle,
      registerSessionDataLayers,
      init,
    }),
    [updateConfig, updateStyle, registerSessionDataLayers, init]
  );

  const bufferedChapterActionsContextValue = useMemo(
    () => ({
      setChapterHasBufferedChanges,
      registerBufferedChapterUpdateBuilder,
      flushBufferedChapterEdits,
    }),
    [
      setChapterHasBufferedChanges,
      registerBufferedChapterUpdateBuilder,
      flushBufferedChapterEdits,
    ]
  );

  const saveContextValue = useMemo(
    () => ({
      isDirty,
      isConfigDirty,
      markRevisionSaved,
      applySavedRevisionConfig,
      getConfigForSave,
    }),
    [
      applySavedRevisionConfig,
      getConfigForSave,
      isConfigDirty,
      isDirty,
      markRevisionSaved,
    ]
  );

  return (
    <StoryMapConfigDataContext.Provider value={configDataContextValue}>
      <StoryMapPreviewContext.Provider value={previewContextValue}>
        <StoryMapMediaContext.Provider value={mediaContextValue}>
          <StoryMapConfigActionsContext.Provider
            value={configActionsContextValue}
          >
            <StoryMapBufferedChapterActionsContext.Provider
              value={bufferedChapterActionsContextValue}
            >
              <StoryMapSaveContext.Provider value={saveContextValue}>
                {children}
              </StoryMapSaveContext.Provider>
            </StoryMapBufferedChapterActionsContext.Provider>
          </StoryMapConfigActionsContext.Provider>
        </StoryMapMediaContext.Provider>
      </StoryMapPreviewContext.Provider>
    </StoryMapConfigDataContext.Provider>
  );
};

export const useStoryMapConfigDataContext = () =>
  useContext(StoryMapConfigDataContext);
export const useStoryMapPreviewContext = () =>
  useContext(StoryMapPreviewContext);
export const useStoryMapMediaContext = () => useContext(StoryMapMediaContext);
export const useStoryMapConfigActionsContext = () =>
  useContext(StoryMapConfigActionsContext);
export const useStoryMapBufferedChapterActionsContext = () =>
  useContext(StoryMapBufferedChapterActionsContext);
export const useStoryMapSaveContext = () => useContext(StoryMapSaveContext);
