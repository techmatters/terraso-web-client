import React, { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { addStoryMap } from 'storyMap/storyMapSlice';

import { MAPBOX_STYLE_DEFAULT } from 'config';

import StoryMapForm from './StoryMapForm';

const BASE_CONFIG = {
  style: MAPBOX_STYLE_DEFAULT,
  theme: 'dark',
  showMarkers: false,
  use3dTerrain: true,
  title: '',
  subtitle: '',
  byline: '',
  chapters: [
    // {
    //   id: 'third-identifier',
    //   alignment: 'left',
    //   title: 'Chapter 1',
    //   description: 'Copy these sections to add to your story.',
    //   location: {
    //     center: [6.15116, 46.20595],
    //     zoom: 12.52,
    //     pitch: 8.01,
    //     bearing: 0.0,
    //   },
    //   mapAnimation: 'flyTo',
    //   rotateAnimation: false,
    //   callback: '',
    //   onChapterEnter: [],
    //   onChapterExit: [],
    // },
    // {
    //   id: 'fourth-chapter',
    //   alignment: 'right',
    //   title: 'Chapter 2',
    //   description: 'Copy these sections to add to your story.',
    //   mapAnimation: 'flyTo',
    //   location: {
    //     center: [-58.54195, -34.716],
    //     zoom: 4,
    //     pitch: 0,
    //     bearing: 0,
    //   },
    //   rotateAnimation: false,
    //   callback: '',
    //   onChapterEnter: [],
    //   onChapterExit: [],
    // },
  ],
};

const StoryMapNew = () => {
  const dispatch = useDispatch();
  const onPublish = useCallback(
    config => {
      dispatch(
        addStoryMap({
          config,
          published: true,
        })
      );
    },
    [dispatch]
  );

  const onSaveDraft = useCallback(
    config => {
      dispatch(
        addStoryMap({
          config,
          published: false,
        })
      );
    },
    [dispatch]
  );
  return (
    <StoryMapForm
      baseConfig={BASE_CONFIG}
      onPublish={onPublish}
      onSaveDraft={onSaveDraft}
    />
  );
};

export default StoryMapNew;
