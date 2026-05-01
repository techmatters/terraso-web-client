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

const StoryMapConfigContext = createContext();
const StoryMapConfigActionsContext = createContext();
const StoryMapSaveContext = createContext();

export const StoryMapConfigContextProvider = props => {
  const { children, baseConfig, storyMap } = props;
  const [config, setConfig] = useState(baseConfig || {});
  const [configRevision, setConfigRevision] = useState(0);
  const [preview, setPreview] = useState(false);
  const [mediaFiles, setMediaFiles] = useState({});
  const [isConfigDirty, setIsConfigDirty] = useState(false);
  const [hasBufferedChapterChanges, setHasBufferedChapterChanges] =
    useState(false);
  const init = useRef(false);
  const latestConfigRef = useRef(baseConfig || {});
  const configRevisionRef = useRef(0);
  const bufferedChapterUpdateBuildersRef = useRef(new Map());
  const chaptersWithBufferedChangesRef = useRef(new Set());

  const commitConfigState = useCallback((nextConfig, dirty = true) => {
    const nextRevision = configRevisionRef.current + 1;
    latestConfigRef.current = nextConfig;
    configRevisionRef.current = nextRevision;
    setConfig(nextConfig);
    setConfigRevision(nextRevision);
    setIsConfigDirty(dirty);

    return {
      config: nextConfig,
      revision: nextRevision,
    };
  }, []);

  const getCurrentConfigSnapshot = useCallback(
    () => ({
      config: latestConfigRef.current,
      revision: configRevisionRef.current,
    }),
    []
  );

  const resolveConfigUpdate = useCallback((currentConfig, newConfigSetter) => {
    const newConfig =
      typeof newConfigSetter === 'function'
        ? newConfigSetter(currentConfig)
        : newConfigSetter;

    const usedDataLayersIds = _.flow(
      _.flatMap(ids => ids),
      _.compact
    )([
      newConfig.titleTransition?.dataLayerConfigId,
      newConfig.chapters.map(chapter => chapter.dataLayerConfigId),
    ]);

    return {
      ...newConfig,
      dataLayers: _.pick(usedDataLayersIds, newConfig.dataLayers),
    };
  }, []);

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
    revision =>
      revision === undefined ||
      revision === null ||
      revision === configRevisionRef.current,
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

      const nextConfig = resolveConfigUpdate(
        latestConfigRef.current,
        savedConfig
      );
      latestConfigRef.current = nextConfig;
      setConfig(nextConfig);
      clearMediaFiles();
      setIsConfigDirty(false);

      return true;
    },
    [clearMediaFiles, isCurrentRevision, resolveConfigUpdate]
  );

  const updateConfig = useCallback(
    (newConfigSetter, dirty = true) => {
      const nextConfig = resolveConfigUpdate(
        latestConfigRef.current,
        newConfigSetter
      );
      commitConfigState(nextConfig, dirty);
    },
    [commitConfigState, resolveConfigUpdate]
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

  const collectBufferedChapterUpdates = useCallback(
    () =>
      Array.from(bufferedChapterUpdateBuildersRef.current.values()).reduce(
        (accumulator, buildBufferedChapterUpdate) => {
          const configUpdater = buildBufferedChapterUpdate();
          if (!configUpdater) {
            return accumulator;
          }

          return {
            hasChanges: true,
            nextConfig: resolveConfigUpdate(
              accumulator.nextConfig,
              configUpdater
            ),
          };
        },
        {
          hasChanges: false,
          nextConfig: latestConfigRef.current,
        }
      ),
    [resolveConfigUpdate]
  );

  const flushBufferedChapterEdits = useCallback(
    (dirty = true) => {
      const { hasChanges, nextConfig } = collectBufferedChapterUpdates();

      if (!hasChanges) {
        return getCurrentConfigSnapshot();
      }

      let nextConfigSnapshot;
      flushSync(() => {
        nextConfigSnapshot = commitConfigState(nextConfig, dirty);
      });

      return nextConfigSnapshot;
    },
    [collectBufferedChapterUpdates, commitConfigState, getCurrentConfigSnapshot]
  );

  const getConfig = useCallback(() => latestConfigRef.current, []);
  const isDirty = isConfigDirty || hasBufferedChapterChanges;

  const configContextValue = useMemo(
    () => ({
      storyMap,
      config,
      configRevision,
      preview,
      setPreview,
      mediaFiles,
    }),
    [storyMap, config, configRevision, preview, mediaFiles]
  );

  const actionsContextValue = useMemo(
    () => ({
      setConfig: updateConfig,
      addMediaFile,
      getMediaFile,
      clearMediaFiles,
      getConfig,
      applySavedRevisionConfig,
      init,
      setChapterHasBufferedChanges,
      registerBufferedChapterUpdateBuilder,
      flushBufferedChapterEdits,
    }),
    [
      updateConfig,
      addMediaFile,
      getMediaFile,
      clearMediaFiles,
      getConfig,
      applySavedRevisionConfig,
      init,
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
    }),
    [isConfigDirty, isDirty, markRevisionSaved]
  );

  return (
    <StoryMapConfigContext.Provider value={configContextValue}>
      <StoryMapConfigActionsContext.Provider value={actionsContextValue}>
        <StoryMapSaveContext.Provider value={saveContextValue}>
          {children}
        </StoryMapSaveContext.Provider>
      </StoryMapConfigActionsContext.Provider>
    </StoryMapConfigContext.Provider>
  );
};

const useDataContext = () => useContext(StoryMapConfigContext);
export const useStoryMapConfigActionsContext = () =>
  useContext(StoryMapConfigActionsContext);
const useSaveContext = () => useContext(StoryMapSaveContext);

export const useStoryMapConfigContext = () => ({
  ...useDataContext(),
  ...useStoryMapConfigActionsContext(),
  ...useSaveContext(),
});
