import React, { useCallback } from 'react';

import _ from 'lodash/fp';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import PageLoader from 'layout/PageLoader';
import { useFetchData } from 'state/utils';

import { fetchStoryMapForm, updateStoryMap } from 'storyMap/storyMapSlice';

import StoryMapForm from './StoryMapForm';

const StoryMapUpdate = () => {
  const dispatch = useDispatch();
  const { slug } = useParams();
  const { fetching, data: storyMap } = useSelector(_.get('storyMap.form'));
  useFetchData(useCallback(() => fetchStoryMapForm({ slug }), [slug]));

  const onPublish = useCallback(
    config => {
      dispatch(
        updateStoryMap({
          id: storyMap?.id,
          config,
          published: true,
        })
      );
    },
    [dispatch, storyMap?.id]
  );

  const onSaveDraft = useCallback(
    config => {
      dispatch(
        updateStoryMap({
          id: storyMap?.id,
          config,
          published: false,
        })
      );
    },
    [dispatch, storyMap?.id]
  );

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <StoryMapForm
      baseConfig={storyMap.config}
      onPublish={onPublish}
      onSaveDraft={onSaveDraft}
    />
  );
};

export default StoryMapUpdate;
