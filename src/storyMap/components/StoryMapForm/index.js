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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useDebounce } from 'use-debounce';
import { v4 as uuidv4 } from 'uuid';
import { Grid, useMediaQuery } from '@mui/material';

import { useAnalytics } from 'monitoring/analytics';
import NavigationBlockedDialog from 'navigation/components/NavigationBlockedDialog';
import { useNavigationBlocker } from 'navigation/navigationContext';
import { isChapterEmpty } from 'storyMap/storyMapUtils';

import StoryMap from '../StoryMap';
import ChapterForm from './ChapterForm';
import ChaptersSidebar from './ChaptersSideBar';
import { useStoryMapConfigContext } from './storyMapConfigContext';
import TitleForm from './TitleForm';
import TopBar from './TopBar';
import TopBarPreview from './TopBarPreview';

import theme from 'theme';

const AUTO_SAVE_DEBOUNCE = 1000;

const BASE_CHAPTER = {
  alignment: 'left',
  title: '',
  description: '',
  mapAnimation: 'flyTo',
  rotateAnimation: false,
  onChapterEnter: [],
  onChapterExit: [],
};

const Preview = props => {
  const { getMediaFile } = useStoryMapConfigContext();
  const { config, onPublish } = props;

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
    <>
      <TopBarPreview onPublish={onPublish} />
      <Grid container>
        <Grid item xs={12}>
          <StoryMap config={previewConfig} chaptersFilter={chaptersFilter} />
        </Grid>
      </Grid>
    </>
  );
};

const StoryMapForm = props => {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const { onPublish, onSaveDraft } = props;
  const requestStatus = useSelector(_.get('storyMap.form'));
  const { error: saveError } = requestStatus;
  const {
    storyMap,
    config,
    setConfig,
    preview,
    init,
    mediaFiles,
    saved,
    isDirty,
  } = useStoryMapConfigContext();
  const [mapHeight, setMapHeight] = useState();
  const [mapWidth, setMapWidth] = useState();
  const [currentStepId, setCurrentStepId] = useState();
  const [scrollToChapter, setScrollToChapter] = useState();

  const [autoSaveData, setAutoSaveData] = useState({
    config,
    mediaFiles,
    isDirty,
  });
  const [autoSaveDataDebounced] = useDebounce(autoSaveData, AUTO_SAVE_DEBOUNCE);
  useEffect(() => {
    setAutoSaveData({
      config,
      mediaFiles,
      isDirty,
    });
  }, [config, mediaFiles, isDirty, saveError]);
  useEffect(() => {
    const { config, mediaFiles, isDirty } = autoSaveDataDebounced;
    if (!isDirty) {
      return;
    }
    onSaveDraft(config, mediaFiles).then(saved);
  }, [autoSaveDataDebounced, onSaveDraft, saved]);

  const isFirefox = useMemo(
    () => navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
    []
  );

  const { isBlocked, proceed, cancel } = useNavigationBlocker(
    isDirty,
    t('storyMap.form_unsaved_changes_message')
  );

  useEffect(() => {
    if (isSmall) {
      return;
    }
    const headerHeight =
      document.getElementById('header-container')?.clientHeight;
    const footerHeight =
      document.getElementsByClassName('footer')?.[0]?.clientHeight;
    const formHeaderHeight =
      document.getElementById('form-header')?.clientHeight + 1;

    setMapHeight(
      `calc(100vh - (${headerHeight}px + ${footerHeight}px + ${formHeaderHeight}px))`
    );
  }, [isSmall]);

  // Focus on the title when the map is ready
  const onMapReady = useCallback(() => {
    const input = document
      .getElementById('story-map-title')
      .querySelector('input');
    input?.focus();
    init.current = true;
  }, [init]);

  useEffect(() => {
    if (!mapHeight) {
      return;
    }
    const chaptersWidth =
      document.getElementById('chapters-sidebar').clientWidth;

    setMapWidth(`calc(100vw - ${chaptersWidth}px)`);
  }, [mapHeight]);

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
    onPublish(config, mediaFiles).then(saved);
  }, [config, mediaFiles, onPublish, saved]);

  const onSaveDraftWrapper = useCallback(() => {
    onSaveDraft(config, mediaFiles).then(saved);
  }, [config, mediaFiles, onSaveDraft, saved]);

  if (preview || isSmall) {
    return <Preview config={config} onPublish={onPublishWrapper} />;
  }

  return (
    <>
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
        requestStatus={requestStatus}
        isDirty={isDirty}
      />
      <Grid
        container
        justifyContent="flex-start"
        alignItems="flex-start"
        sx={{ height: mapHeight }}
      >
        <ChaptersSidebar
          config={config}
          currentStepId={currentStepId}
          onAdd={onAddChapter}
          onDelete={onDeleteChapter}
          onMoveChapter={onMoveChapter}
          height={mapHeight}
        />
        <Grid
          item
          xs
          sx={{
            height: mapHeight,
            // There is no overlay support for Firefox, see: https://developer.mozilla.org/en-US/docs/Web/CSS/overflow
            overflowY: isFirefox ? 'scroll' : 'overlay',
          }}
        >
          {mapHeight && mapWidth && (
            <StoryMap
              config={config}
              mapCss={{ height: mapHeight, width: mapWidth }}
              onStepChange={setCurrentStepId}
              ChapterComponent={ChapterForm}
              TitleComponent={TitleForm}
              onReady={onMapReady}
            />
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default StoryMapForm;
