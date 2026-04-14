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
  const configRef = useRef(baseConfig || {});
  const configRevisionRef = useRef(0);
  const bufferedChapterChangeFlushersRef = useRef(new Map());
  const bufferedDirtyChaptersRef = useRef(new Set());

  const bumpConfigRevision = useCallback(() => {
    const nextRevision = configRevisionRef.current + 1;
    configRevisionRef.current = nextRevision;
    setConfigRevision(nextRevision);
    return nextRevision;
  }, []);

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

  const saved = useCallback(
    revision => {
      if (!isCurrentRevision(revision)) {
        return;
      }

      setIsConfigDirty(false);
    },
    [isCurrentRevision]
  );

  const applySavedConfig = useCallback(
    (revision, savedConfig) => {
      if (!isCurrentRevision(revision)) {
        return false;
      }

      const nextConfig = resolveConfigUpdate(configRef.current, savedConfig);
      configRef.current = nextConfig;
      setConfig(nextConfig);
      clearMediaFiles();
      setIsConfigDirty(false);

      return true;
    },
    [clearMediaFiles, isCurrentRevision, resolveConfigUpdate]
  );

  const setConfigWrapper = useCallback(
    (newConfigSetter, dirty = true) => {
      setConfig(currentConfig => {
        const nextConfig = resolveConfigUpdate(currentConfig, newConfigSetter);
        configRef.current = nextConfig;
        return nextConfig;
      });
      bumpConfigRevision();
      setIsConfigDirty(dirty);
    },
    [bumpConfigRevision, resolveConfigUpdate]
  );

  const setBufferedChapterChangesPending = useCallback(
    (chapterId, hasPendingChanges) => {
      const dirtyChapters = bufferedDirtyChaptersRef.current;
      const isAlreadyPending = dirtyChapters.has(chapterId);

      if (isAlreadyPending === hasPendingChanges) {
        return;
      }

      if (hasPendingChanges) {
        dirtyChapters.add(chapterId);
      } else {
        dirtyChapters.delete(chapterId);
      }

      setHasBufferedChapterChanges(dirtyChapters.size > 0);
    },
    []
  );

  const registerBufferedChapterChangesFlusher = useCallback(
    (chapterId, flusher) => {
      bufferedChapterChangeFlushersRef.current.set(chapterId, flusher);

      return () => {
        bufferedChapterChangeFlushersRef.current.delete(chapterId);
      };
    },
    []
  );

  const flushBufferedChapterChanges = useCallback(
    (dirty = true) => {
      const { hasChanges, nextConfig } = Array.from(
        bufferedChapterChangeFlushersRef.current.values()
      ).reduce(
        (accumulator, flusher) => {
          const configUpdater = flusher();
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
          nextConfig: configRef.current,
        }
      );

      if (!hasChanges) {
        return {
          config: configRef.current,
          revision: configRevisionRef.current,
        };
      }

      flushSync(() => {
        const nextRevision = configRevisionRef.current + 1;
        configRevisionRef.current = nextRevision;
        configRef.current = nextConfig;
        setConfigRevision(nextRevision);
        setConfig(nextConfig);
        setIsConfigDirty(dirty);
      });

      return {
        config: nextConfig,
        revision: configRevisionRef.current,
      };
    },
    [resolveConfigUpdate]
  );

  const getConfig = useCallback(() => configRef.current, []);
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
      setConfig: setConfigWrapper,
      addMediaFile,
      getMediaFile,
      clearMediaFiles,
      getConfig,
      applySavedConfig,
      init,
      setBufferedChapterChangesPending,
      registerBufferedChapterChangesFlusher,
      flushBufferedChapterChanges,
    }),
    [
      setConfigWrapper,
      addMediaFile,
      getMediaFile,
      clearMediaFiles,
      getConfig,
      applySavedConfig,
      init,
      setBufferedChapterChangesPending,
      registerBufferedChapterChangesFlusher,
      flushBufferedChapterChanges,
    ]
  );

  const saveContextValue = useMemo(
    () => ({
      isDirty,
      isConfigDirty,
      saved,
    }),
    [isConfigDirty, isDirty, saved]
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
