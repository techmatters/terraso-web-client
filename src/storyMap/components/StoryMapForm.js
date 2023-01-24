import React, { useEffect } from 'react';

import { Button, Grid, List, ListItemButton } from '@mui/material';

import { MAPBOX_STYLE_DEFAULT } from 'config';

import StoryMap from './StoryMap';

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
  const { config } = props;
  const { chapters } = config;

  const scrollTo = id => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  return (
    <Grid
      className="chapters-sidebar"
      item
      component={List}
      xs={2}
      sx={{ height: '100%' }}
    >
      <ListItemButton onClick={() => scrollTo('header')}>Title</ListItemButton>
      {chapters.map(chapter => (
        <ListItemButton key={chapter.id} onClick={() => scrollTo(chapter.id)}>
          {chapter.title}
        </ListItemButton>
      ))}
    </Grid>
  );
};

const StoryMapForm = () => {
  const [height, setHeight] = React.useState('100vh');
  const [mapCss, setMapCss] = React.useState();
  const [config, setConfig] = React.useState(BASE_CONFIG);

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

  return (
    <Grid container sx={{ height }}>
      <Grid
        className="form-header"
        item
        xs={12}
        sx={{ backgroundColor: 'red', width: '100%', zIndex: 2 }}
      >
        <Button
          onClick={() => setConfig(config => ({ ...config, title: 'Test' }))}
        >
          Test
        </Button>
      </Grid>
      <Chapters config={config} />
      <Grid item xs={10} sx={{ overflow: 'hidden', height: '100%' }}>
        {mapCss && <StoryMap config={config} mapCss={mapCss} />}
      </Grid>
    </Grid>
  );
};

export default StoryMapForm;
