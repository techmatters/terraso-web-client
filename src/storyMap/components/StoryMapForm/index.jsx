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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import logger from 'terraso-client-shared/monitoring/logger';
import { useDebounce } from 'use-debounce';
import { v4 as uuidv4 } from 'uuid';
import { Box, Grid, useMediaQuery } from '@mui/material';

import { useAnalytics } from 'terraso-web-client/monitoring/analytics';
import NavigationBlockedDialog from 'terraso-web-client/navigation/components/NavigationBlockedDialog';
import { useNavigationBlocker } from 'terraso-web-client/navigation/navigationContext';
import StoryMap from 'terraso-web-client/storyMap/components/StoryMap';
import BufferedChapterForm from 'terraso-web-client/storyMap/components/StoryMapForm/BufferedChapterForm';
import ChaptersSidebar from 'terraso-web-client/storyMap/components/StoryMapForm/ChaptersSideBar';
import ConfigureChapterSidebar from 'terraso-web-client/storyMap/components/StoryMapForm/ConfigureChapterSidebar';
import RightSidebar from 'terraso-web-client/storyMap/components/StoryMapForm/RightSidebar';
import {
  useStoryMapBufferedChapterActionsContext,
  useStoryMapConfigActionsContext,
  useStoryMapConfigDataContext,
  useStoryMapMediaContext,
  useStoryMapPreviewContext,
  useStoryMapSaveContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import TitleForm from 'terraso-web-client/storyMap/components/StoryMapForm/TitleForm';
import TopBar from 'terraso-web-client/storyMap/components/StoryMapForm/TopBar';
import TopBarPreview from 'terraso-web-client/storyMap/components/StoryMapForm/TopBarPreview';
import { STORY_MAP_TITLE_ID } from 'terraso-web-client/storyMap/storyMapConstants';
import {
  getTransition,
  isChapterEmpty,
  updateTransition,
} from 'terraso-web-client/storyMap/storyMapUtils';

import { STORY_MAP_AUTO_SAVE_DEBOUNCE } from 'terraso-web-client/config';

import theme from 'terraso-web-client/theme';

const BASE_CHAPTER = {
  alignment: 'left',
  title: '',
  description: '',
  onChapterEnter: [],
};

// The editor shows exactly ONE right sidebar at a time (mutually exclusive):
// the Configure Chapter sidebar (open by default) or the Settings sidebar.
const RIGHT_SIDEBAR_CONFIGURE = 'configure';
const RIGHT_SIDEBAR_SETTINGS = 'settings';

const Preview = props => {
  const { getMediaFile } = useStoryMapMediaContext();
  const { config, onPublish, isPublishing } = props;

  const previewConfig = useMemo(
    () => ({
      ...config,
      chapters: config.chapters.map(chapter => {
        if (!chapter.media || chapter.media.url) {
          return chapter;
        }
        return {
          ...chapter,
          media: {
            ...chapter.media,
            url: getMediaFile(chapter.media.contentId),
          },
        };
      }),
    }),
    [config, getMediaFile]
  );

  const chaptersFilter = useCallback(chapters => !isChapterEmpty(chapters), []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBarPreview onPublish={onPublish} isPublishing={isPublishing} />
      <Box sx={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <StoryMap
          config={previewConfig}
          chaptersFilter={chaptersFilter}
          isContained
        />
      </Box>
    </Box>
  );
};

const StoryMapForm = props => {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const {
    onPublish,
    onSaveDraft,
    autoSaveDebounce = STORY_MAP_AUTO_SAVE_DEBOUNCE,
  } = props;
  const saveRequestStatus = useSelector(_.get('storyMap.form'));
  const { error: saveError, saving } = saveRequestStatus;
  const { storyMap, config, configRevision } = useStoryMapConfigDataContext();
  const { preview } = useStoryMapPreviewContext();
  const { mediaFiles: draftMediaFiles } = useStoryMapMediaContext();
  const { setConfig, init } = useStoryMapConfigActionsContext();
  const { flushBufferedChapterEdits } =
    useStoryMapBufferedChapterActionsContext();
  const { isConfigDirty, isDirty, markRevisionSaved } =
    useStoryMapSaveContext();
  const [currentStepId, setCurrentStepId] = useState();
  const [scrollToChapter, setScrollToChapter] = useState();
  const [rightSidebar, setRightSidebar] = useState(RIGHT_SIDEBAR_CONFIGURE);
  const [isPublishing, setIsPublishing] = useState(false);
  // The map editing session (inside StoryMap) is the ONE owner of the fit
  // channel: it hands its fit-layer-bounds requester here while mounted.
  const fitLayerBoundsRequesterRef = useRef(null);
  // Save serialization: never run two saves concurrently (last-write-wins
  // races) and never land a stale draft after a newer save/publish.
  const saveInFlightRef = useRef(null);
  const lastSavedRevisionRef = useRef(-1);
  const currentRevisionRef = useRef(0);
  currentRevisionRef.current = configRevision;
  const [saveSettleTick, setSaveSettleTick] = useState(0);

  const draftAutoSaveSnapshot = useMemo(
    () => ({
      config,
      configRevision,
      mediaFiles: draftMediaFiles,
      isConfigDirty,
      saving,
      saveError,
    }),
    [config, configRevision, draftMediaFiles, isConfigDirty, saveError, saving]
  );
  const [debouncedDraftAutoSaveSnapshot] = useDebounce(
    draftAutoSaveSnapshot,
    autoSaveDebounce
  );

  const persistSaveOperationWithBufferedChapterEdits = useCallback(
    persistStoryMap => {
      const { config: configToPersist, revision } = flushBufferedChapterEdits();
      lastSavedRevisionRef.current = Math.max(
        lastSavedRevisionRef.current,
        revision
      );

      return persistStoryMap(configToPersist, draftMediaFiles, revision).then(
        () => {
          markRevisionSaved(revision);
        }
      );
    },
    [draftMediaFiles, flushBufferedChapterEdits, markRevisionSaved]
  );

  const persistDraftAutoSave = useCallback(
    (configToPersist, revision, mediaFilesToPersist) => {
      lastSavedRevisionRef.current = Math.max(
        lastSavedRevisionRef.current,
        revision
      );
      return onSaveDraft(configToPersist, mediaFilesToPersist, revision).then(
        () => {
          markRevisionSaved(revision);
        }
      );
    },
    [markRevisionSaved, onSaveDraft]
  );

  // ONE save at a time: concurrent saves resolve last-write-wins on the
  // backend. User-initiated saves QUEUE behind the in-flight one (they read
  // the LATEST config when they run); autosaves are skipped upstream and
  // retried when the in-flight save settles (see `saveSettleTick`).
  const runSave = useCallback(saveOperation => {
    const previous = saveInFlightRef.current ?? Promise.resolve();
    const inFlight = previous.then(saveOperation, saveOperation);
    saveInFlightRef.current = inFlight;
    inFlight
      .catch(() => {})
      .finally(() => {
        if (saveInFlightRef.current === inFlight) {
          saveInFlightRef.current = null;
        }
        setSaveSettleTick(tick => tick + 1);
      });
    return inFlight;
  }, []);

  useEffect(() => {
    const {
      config: configToPersist,
      isConfigDirty: hasPendingConfigChanges,
      configRevision: revision,
      mediaFiles: mediaFilesToPersist,
    } = debouncedDraftAutoSaveSnapshot;
    if (isPublishing || !hasPendingConfigChanges) {
      return;
    }
    if (saveInFlightRef.current) {
      // A save is in flight — retried when it settles.
      return;
    }
    if (revision <= lastSavedRevisionRef.current) {
      // Stale draft: a newer revision was already saved or published.
      return;
    }
    if (revision !== currentRevisionRef.current) {
      // The config moved on while this snapshot was debounced; the pending
      // snapshot carries the newer state.
      return;
    }
    runSave(() =>
      persistDraftAutoSave(
        configToPersist,
        revision,
        mediaFilesToPersist
      ).catch(error => {
        logger.error('Error auto saving story map', error);
      })
    );
  }, [
    debouncedDraftAutoSaveSnapshot,
    isPublishing,
    persistDraftAutoSave,
    runSave,
    saveSettleTick,
  ]);

  const { isBlocked, proceed, cancel } = useNavigationBlocker(
    isDirty,
    t('storyMap.form_unsaved_changes_message')
  );

  // Focus on the title when the map is ready
  const onMapReady = useCallback(() => {
    const input = document
      .getElementById(STORY_MAP_TITLE_ID)
      .querySelector('input');
    input?.focus();
    init.current = true;
  }, [init]);

  useEffect(() => {
    if (!scrollToChapter) {
      return;
    }
    document
      .getElementById(scrollToChapter)
      ?.scrollIntoView({ block: 'start' });
  }, [scrollToChapter]);

  const onAddChapter = useCallback(() => {
    const id = `chapter-${uuidv4()}`;
    setConfig(config => ({
      ...config,
      chapters: [
        ...config.chapters,
        {
          ...BASE_CHAPTER,
          id,
        },
      ],
    }));
    setScrollToChapter(id);
  }, [setConfig]);

  const onDeleteChapter = useCallback(
    id => () => {
      setConfig(config => ({
        ...config,
        chapters: config.chapters.filter(chapter => chapter.id !== id),
      }));
    },
    [setConfig]
  );

  const onMoveChapter = useCallback(
    (id, index) => {
      setConfig(config => {
        const fromIndex = config.chapters.findIndex(
          chapter => chapter.id === id
        );
        if (fromIndex === index) {
          return config;
        }
        const withoutChapter = config.chapters.filter(
          chapter => chapter.id !== id
        );
        const newChapters = [
          ..._.slice(0, index, withoutChapter),
          config.chapters.find(chapter => chapter.id === id),
          ..._.slice(index, withoutChapter.length, withoutChapter),
        ];
        const toIndex = newChapters.findIndex(chapter => chapter.id === id);
        trackEvent('storymap.chapter.move', {
          props: {
            distance: toIndex - fromIndex,
            map: storyMap.id,
          },
        });
        return {
          ...config,
          chapters: newChapters,
        };
      });
    },
    [setConfig, trackEvent, storyMap]
  );

  const onPublishWrapper = useCallback(() => {
    if (isPublishing) {
      return Promise.resolve(false);
    }

    setIsPublishing(true);

    return runSave(() =>
      persistSaveOperationWithBufferedChapterEdits(onPublish)
    ).finally(() => {
      setIsPublishing(false);
    });
  }, [
    isPublishing,
    onPublish,
    persistSaveOperationWithBufferedChapterEdits,
    runSave,
  ]);

  const onSaveDraftWrapper = useCallback(
    () =>
      runSave(() => persistSaveOperationWithBufferedChapterEdits(onSaveDraft)),
    [onSaveDraft, persistSaveOperationWithBufferedChapterEdits, runSave]
  );

  const closeRightSidebar = useCallback(() => {
    setRightSidebar(null);
  }, []);

  const toggleSettings = useCallback(() => {
    setRightSidebar(current =>
      current === RIGHT_SIDEBAR_SETTINGS ? null : RIGHT_SIDEBAR_SETTINGS
    );
  }, []);

  const toggleConfigureChapter = useCallback(() => {
    setRightSidebar(current =>
      current === RIGHT_SIDEBAR_CONFIGURE ? null : RIGHT_SIDEBAR_CONFIGURE
    );
  }, []);

  const onFitLayerBounds = useCallback(requester => {
    fitLayerBoundsRequesterRef.current = requester;
  }, []);

  const requestFitBounds = useCallback(layerId => {
    fitLayerBoundsRequesterRef.current?.(layerId);
  }, []);

  // Immediate-apply map camera edits: the map editing session writes the
  // USER's moves (gesture-terminated only) to the gesture-start target.
  const onMapPositionChange = useCallback(
    (position, targetId) => {
      setConfig(config => {
        // The gesture's target can disappear mid-edit (its chapter is
        // deleted while the map is being dragged): never drop the user's
        // camera silently — fall back to the title step.
        const id = getTransition({ config, id: targetId })
          ? targetId
          : STORY_MAP_TITLE_ID;
        if (id !== targetId) {
          logger.warn(
            `Map camera write for deleted step ${targetId}: falling back to the title step`
          );
        }
        return updateTransition({
          config,
          id,
          update: transition => ({ ...transition, location: position }),
        });
      });
    },
    [setConfig]
  );

  const onMapStyleChange = useCallback(
    style => {
      setConfig(_.set('style', style));
    },
    [setConfig]
  );

  if (preview || isSmall) {
    return (
      <Preview
        config={config}
        onPublish={onPublishWrapper}
        isPublishing={isPublishing}
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {isBlocked && (
        <NavigationBlockedDialog
          title={t('storyMap.form_unsaved_changes_title')}
          message={t('storyMap.form_unsaved_changes_message')}
          onConfirm={proceed}
          onCancel={cancel}
        />
      )}
      <TopBar
        onPublish={onPublishWrapper}
        onSaveDraft={onSaveDraftWrapper}
        requestStatus={saveRequestStatus}
        isDirty={isDirty}
        isPublishing={isPublishing}
        onToggleSettings={toggleSettings}
        isSettingsOpen={rightSidebar === RIGHT_SIDEBAR_SETTINGS}
        onToggleConfigureChapter={toggleConfigureChapter}
        isConfigureChapterOpen={rightSidebar === RIGHT_SIDEBAR_CONFIGURE}
      />
      <Grid
        container
        wrap="nowrap"
        sx={{
          justifyContent: 'flex-start',
          width: '100%',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <ChaptersSidebar
          config={config}
          currentStepId={currentStepId}
          onAdd={onAddChapter}
          onDelete={onDeleteChapter}
          onMoveChapter={onMoveChapter}
          onSelect={setCurrentStepId}
        />
        <Box sx={{ flex: 1 }}>
          <StoryMap
            config={config}
            onStepChange={setCurrentStepId}
            activeStepId={currentStepId}
            ChapterComponent={BufferedChapterForm}
            TitleComponent={TitleForm}
            onReady={onMapReady}
            isContained
            mapEditing={rightSidebar === RIGHT_SIDEBAR_CONFIGURE}
            onMapPositionChange={onMapPositionChange}
            onMapStyleChange={onMapStyleChange}
            onFitLayerBounds={onFitLayerBounds}
            // The editor never rotates (playback feature).
            playRotateAnimation={false}
          />
        </Box>
        {rightSidebar === RIGHT_SIDEBAR_CONFIGURE && (
          <ConfigureChapterSidebar
            open
            onClose={closeRightSidebar}
            activeStepId={currentStepId ?? STORY_MAP_TITLE_ID}
            onFitLayerBounds={requestFitBounds}
          />
        )}
        {rightSidebar === RIGHT_SIDEBAR_SETTINGS && (
          <RightSidebar open onClose={closeRightSidebar} />
        )}
      </Grid>
    </Box>
  );
};

export default StoryMapForm;
