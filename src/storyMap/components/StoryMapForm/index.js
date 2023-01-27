import React, { useCallback, useEffect, useState } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Grid } from '@mui/material';

import { MAPBOX_STYLE_DEFAULT } from 'config';

import StoryMap from '../StoryMap';
import ChapterForm from './ChapterForm';
import ChaptersSidebar from './ChaptersSideBar';
import TitleForm from './TitleForm';
import TopBar from './TopBar';
import TopBarPreview from './TopBarPreview';
import { ConfigContextProvider } from './configContext';

const BASE_CHAPTER = {
  alignment: 'left',
  title: '',
  description: '',
  mapAnimation: 'flyTo',
  rotateAnimation: false,
  callback: '',
  onChapterEnter: [],
  onChapterExit: [],
};

const BASE_CONFIG = {
  style: MAPBOX_STYLE_DEFAULT,
  theme: 'dark',
  showMarkers: false,
  chapters: [
    {
      id: 'third-identifier',
      alignment: 'left',
      title: 'Chapter 1',
      description: 'Copy these sections to add to your story.',
      location: {
        center: [6.15116, 46.20595],
        zoom: 12.52,
        pitch: 8.01,
        bearing: 0.0,
      },
      mapAnimation: 'flyTo',
      rotateAnimation: false,
      callback: '',
      onChapterEnter: [],
      onChapterExit: [],
    },
    {
      id: 'fourth-chapter',
      alignment: 'right',
      title: 'Chapter 2',
      description: 'Copy these sections to add to your story.',
      mapAnimation: 'flyTo',
      location: {
        center: [-58.54195, -34.716],
        zoom: 4,
        pitch: 0,
        bearing: 0,
      },
      rotateAnimation: false,
      callback: '',
      onChapterEnter: [],
      onChapterExit: [],
    },
  ],
};

const StoryMapForm = () => {
  const { t } = useTranslation();
  const { data: user } = useSelector(_.get('account.currentUser'));
  const [height, setHeight] = useState('100vh');
  const [mapHeight, setMapHeight] = useState();
  const [mapWidth, setMapWidth] = useState();
  const [config, setConfig] = useState({
    ...BASE_CONFIG,
    byline: t('storyMap.form_byline', { user }),
  });
  const [currentStepId, setCurrentStepId] = useState();
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const headerHeight =
      document.getElementsByClassName('header-container')[0].clientHeight;
    const footerHeight =
      document.getElementsByClassName('footer')[0].clientHeight;
    const formHeaderHeight =
      document.getElementsByClassName('form-header')[0].clientHeight;

    setHeight(`calc(100vh - (${headerHeight}px + ${footerHeight}px))`);
    setMapHeight(
      `calc(100vh - (${headerHeight}px + ${footerHeight}px + ${formHeaderHeight}px))`
    );
  }, []);

  useEffect(() => {
    if (!mapHeight) {
      return;
    }
    const chaptersWidth =
      document.getElementsByClassName('chapters-sidebar')[0].clientWidth;

    setMapWidth(`calc(100vw - ${chaptersWidth}px)`);
  }, [mapHeight]);

  const onAdd = useCallback(() => {
    setConfig(config => ({
      ...config,
      chapters: [
        ...config.chapters,
        {
          ...BASE_CHAPTER,
          id: `chapter-${config.chapters.length + 1}`,
        },
      ],
    }));
  }, []);

  const onDelete = useCallback(
    id => () => {
      setConfig(config => ({
        ...config,
        chapters: config.chapters.filter(chapter => chapter.id !== id),
      }));
    },
    [setConfig]
  );

  if (preview) {
    return (
      <ConfigContextProvider value={{ config, setConfig, setPreview }}>
        <Grid container>
          <TopBarPreview />
          <Grid item xs={12}>
            <StoryMap config={config} />
          </Grid>
        </Grid>
      </ConfigContextProvider>
    );
  }

  return (
    <ConfigContextProvider value={{ config, setConfig, setPreview }}>
      <Grid
        container
        justifyContent="flex-start"
        alignItems="flex-start"
        sx={{ height }}
      >
        <TopBar />
        <ChaptersSidebar
          config={config}
          currentStepId={currentStepId}
          onAdd={onAdd}
          onDelete={onDelete}
          height={mapHeight}
        />
        <Grid item xs={10} sx={{ height: mapHeight, overflow: 'auto' }}>
          {mapHeight && mapWidth && (
            <StoryMap
              config={config}
              mapCss={{ height: mapHeight, width: mapWidth }}
              onStepChange={setCurrentStepId}
              ChapterComponent={ChapterForm}
              TitleComponent={TitleForm}
            />
          )}
        </Grid>
      </Grid>
    </ConfigContextProvider>
  );
};

export default StoryMapForm;
