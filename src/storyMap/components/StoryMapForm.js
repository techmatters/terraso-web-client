import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Button, Grid, List, ListItemButton } from '@mui/material';

import { MAPBOX_STYLE_DEFAULT } from 'config';

import StoryMap from './StoryMap';

const BASE_CHAPTER = {
  alignment: 'left',
  title: '',
  description: '',
  mapAnimation: 'jumpTo',
  rotateAnimation: false,
  callback: '',
  onChapterEnter: [],
  onChapterExit: [],
};

const BASE_CONFIG = {
  style: MAPBOX_STYLE_DEFAULT,
  theme: 'dark',
  title: 'The Title Text of this Story',
  subtitle: 'A descriptive and interesting subtitle to draw in the reader',
  byline: 'By a Digital Storyteller',
  showMarkers: true,
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
      mapAnimation: 'jumpTo',
      rotateAnimation: false,
      callback: '',
      onChapterEnter: [],
      onChapterExit: [],
    },
    {
      id: 'fourth-chapter',
      alignment: 'fully',
      title: 'Chapter 2',
      description: 'Copy these sections to add to your story.',
      mapAnimation: 'jumpTo',
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

const Chapters = props => {
  const { t } = useTranslation();
  const { config, currentStepId, onAdd } = props;
  const { chapters } = config;

  const scrollTo = id => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const listItems = useMemo(
    () => [
      {
        label: `0. ${t('storyMap.form_title_chapter_label')}`,
        id: 'header',
        active: currentStepId === 'header',
      },
      ...chapters.map((chapter, index) => ({
        label: `${index + 1}. ${
          chapter.title || t('storyMap.form_chapter_no_title_label')
        }`,
        id: chapter.id,
        active: currentStepId === chapter.id,
      })),
    ],
    [chapters, currentStepId, t]
  );

  return (
    <Grid
      className="chapters-sidebar"
      item
      component={List}
      xs={2}
      sx={{ height: '100%' }}
    >
      {listItems.map(item => (
        <ListItemButton
          key={item.id}
          sx={{
            bgcolor: item.active ? 'blue.mid' : 'transparent',
            '&:hover': { bgcolor: item.active ? 'blue.mid' : 'gray.lite1' },
          }}
          onClick={() => scrollTo(item.id)}
        >
          {item.label}
        </ListItemButton>
      ))}
      <ListItemButton onClick={onAdd}>Add</ListItemButton>
    </Grid>
  );
};

const StoryMapForm = () => {
  const [height, setHeight] = useState('100vh');
  const [mapCss, setMapCss] = useState();
  const [config, setConfig] = useState(BASE_CONFIG);
  const [currentStepId, setCurrentStepId] = useState();

  useEffect(() => {
    const headerHeight =
      document.getElementsByClassName('header-container')[0].clientHeight;
    const footerHeight =
      document.getElementsByClassName('footer')[0].clientHeight;
    const formHeaderHeight =
      document.getElementsByClassName('form-header')[0].clientHeight;
    const chaptersWidth =
      document.getElementsByClassName('chapters-sidebar')[0].clientWidth;

    setHeight(`calc(100vh - (${headerHeight}px + ${footerHeight}px))`);
    setMapCss({
      width: `calc(100vw - ${chaptersWidth}px)`,
      height: `calc(100vh - (${headerHeight}px + ${footerHeight}px + ${formHeaderHeight}px))`,
    });
  }, []);

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

  return (
    <Grid container sx={{ height }}>
      <Grid
        className="form-header"
        item
        xs={12}
        sx={{ backgroundColor: 'red', width: '100%', zIndex: 2 }}
      >
        <Button
          onClick={() =>
            setConfig(config => ({
              ...config,
              chapters: config.chapters.map(chapter => {
                if (chapter.id === 'fourth-chapter') {
                  return {
                    ...chapter,
                    title: 'Chapter 2 - Updated',
                  };
                }
                return chapter;
              }),
            }))
          }
        >
          Test
        </Button>
      </Grid>
      <Chapters config={config} currentStepId={currentStepId} onAdd={onAdd} />
      <Grid item xs={10} sx={{ overflow: 'hidden', height: '100%' }}>
        {mapCss && (
          <StoryMap
            config={config}
            mapCss={mapCss}
            onStepChange={setCurrentStepId}
          />
        )}
      </Grid>
    </Grid>
  );
};

export default StoryMapForm;
