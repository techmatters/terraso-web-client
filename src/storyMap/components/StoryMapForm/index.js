import React, { useCallback, useEffect, useState } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Grid } from '@mui/material';

import PageLoader from 'layout/PageLoader';

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

const StoryMapForm = props => {
  const { t } = useTranslation();
  const { baseConfig, onPublish, onSaveDraft } = props;
  const { saving } = useSelector(_.get('storyMap.form'));
  const { data: user } = useSelector(_.get('account.currentUser'));
  const [height, setHeight] = useState('100vh');
  const [mapHeight, setMapHeight] = useState();
  const [mapWidth, setMapWidth] = useState();
  const [config, setConfig] = useState({
    ...baseConfig,
    byline: t('storyMap.form_byline', { user }),
  });
  const [currentStepId, setCurrentStepId] = useState();
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const headerHeight =
      document.getElementById('header-container').clientHeight;
    const footerHeight =
      document.getElementsByClassName('footer')[0].clientHeight;
    const formHeaderHeight =
      document.getElementById('form-header').clientHeight;

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
      document.getElementById('chapters-sidebar').clientWidth;

    setMapWidth(`calc(100vw - ${chaptersWidth}px)`);
  }, [mapHeight]);

  const onAddChapter = useCallback(() => {
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
    () => onPublish(config),
    [config, onPublish]
  );

  const onSaveDraftWrapper = useCallback(
    () => onSaveDraft(config),
    [config, onSaveDraft]
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
      {saving && <PageLoader />}
      <Grid
        container
        justifyContent="flex-start"
        alignItems="flex-start"
        sx={{ height }}
      >
        <TopBar onPublish={onPublishWrapper} onSaveDraft={onSaveDraftWrapper} />
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
            overflowY: 'overlay',
          }}
        >
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
