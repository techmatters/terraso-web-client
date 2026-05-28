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

const pruneUnusedDataLayers = nextConfig => {
  const referencedDataLayerIds = _.flow(
    _.flatMap(ids => ids),
    _.compact
  )([
    nextConfig.titleTransition?.dataLayerConfigId,
    nextConfig.chapters.map(chapter => chapter.dataLayerConfigId),
  ]);

  return {
    ...nextConfig,
    dataLayers: _.pick(referencedDataLayerIds, nextConfig.dataLayers),
  };
};

const applyConfigUpdate = (currentConfig, nextConfigSetter) => {
  const nextConfig = resolveConfigUpdate(currentConfig, nextConfigSetter);

  return pruneUnusedDataLayers(nextConfig);
};

export const StoryMapConfigContextProvider = props => {
  const { children, baseConfig, storyMap } = props;
  const initialConfig = baseConfig || {};
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
  const bufferedChapterUpdateBuildersRef = useRef(new Map());
  const chaptersWithBufferedChangesRef = useRef(new Set());

  const commitConfigSnapshot = useCallback((nextConfig, dirty = true) => {
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
    setIsConfigDirty(dirty);

    return createConfigSnapshot(nextConfig, nextRevision);
  }, []);

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
    (nextConfigSetter, dirty = true) => {
      const nextConfig = applyConfigUpdate(
        latestConfigRef.current,
        nextConfigSetter
      );
      commitConfigSnapshot(nextConfig, dirty);
    },
    [commitConfigSnapshot]
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
    (dirty = true) => {
      const { hasChanges, nextConfig } = collectBufferedChapterConfigUpdate();

      if (!hasChanges) {
        return getLatestConfigSnapshot();
      }

      let nextConfigSnapshot;
      flushSync(() => {
        nextConfigSnapshot = commitConfigSnapshot(nextConfig, dirty);
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
      init,
    }),
    [updateConfig, init]
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
    }),
    [applySavedRevisionConfig, isConfigDirty, isDirty, markRevisionSaved]
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
