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
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import { Grid, useMediaQuery } from '@mui/material';

import PageLoader from 'layout/PageLoader';

import StoryMap from '../StoryMap';
import ChapterForm from './ChapterForm';
import ChaptersSidebar from './ChaptersSideBar';
import TitleForm from './TitleForm';
import TopBar from './TopBar';
import TopBarPreview from './TopBarPreview';
import { useStoryMapConfigContext } from './storyMapConfigContext';

import theme from 'theme';

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

  return (
    <Grid container>
      <TopBarPreview onPublish={onPublish} />
      <Grid item xs={12}>
        <StoryMap config={previewConfig} />
      </Grid>
    </Grid>
  );
};

const StoryMapForm = props => {
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const { onPublish, onSaveDraft } = props;
  const { saving } = useSelector(_.get('storyMap.form'));
  const { config, setConfig, preview, init, mediaFiles } =
    useStoryMapConfigContext();
  const [mapHeight, setMapHeight] = useState();
  const [mapWidth, setMapWidth] = useState();
  const [currentStepId, setCurrentStepId] = useState();
  const [scrollToChapter, setScrollToChapter] = useState();

  const isFirefox = useMemo(
    () => navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
    []
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
      document.getElementById('form-header')?.clientHeight;

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

  const onPublishWrapper = useCallback(
    () => onPublish(config, mediaFiles),
    [config, mediaFiles, onPublish]
  );

  const onSaveDraftWrapper = useCallback(
    () => onSaveDraft(config, mediaFiles),
    [config, mediaFiles, onSaveDraft]
  );

  if (preview || isSmall) {
    return <Preview config={config} onPublish={onPublishWrapper} />;
  }

  return (
    <>
      {saving && <PageLoader />}
      <TopBar onPublish={onPublishWrapper} onSaveDraft={onSaveDraftWrapper} />
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
          height={mapHeight}
        />
        <Grid
          item
          xs
          sx={{
            height: mapHeight,
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
