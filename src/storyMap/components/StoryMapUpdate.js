import React, { useCallback, useEffect } from 'react';

import _ from 'lodash/fp';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import PageLoader from 'layout/PageLoader';
import { useFetchData } from 'state/utils';

import {
  fetchStoryMapForm,
  resetForm,
  updateStoryMap,
} from 'storyMap/storyMapSlice';

import StoryMapForm from './StoryMapForm';
import {
  ConfigContextProvider,
  useConfigContext,
} from './StoryMapForm/configContext';

const StoryMapUpdate = props => {
  const dispatch = useDispatch();
  const { storyMap } = props;
  const { mediaFiles } = useConfigContext();

  const onPublish = useCallback(
    config => {
      dispatch(
        updateStoryMap({
          storyMap: {
            id: storyMap?.id,
            config,
            published: false,
          },
          files: mediaFiles,
        })
      );
    },
    [dispatch, storyMap?.id, mediaFiles]
  );

  const onSaveDraft = useCallback(
    config => {
      dispatch(
        updateStoryMap({
          storyMap: {
            id: storyMap?.id,
            config,
            published: false,
          },
          files: mediaFiles,
        })
      );
    },
    [dispatch, storyMap?.id, mediaFiles]
  );

  return <StoryMapForm onPublish={onPublish} onSaveDraft={onSaveDraft} />;
};

const ContextWrapper = props => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { fetching, data: storyMap } = useSelector(_.get('storyMap.form'));

  useEffect(() => {
    dispatch(resetForm());
  }, [dispatch]);

  useFetchData(useCallback(() => fetchStoryMapForm({ slug }), [slug]));

  if (fetching || !storyMap) {
    return <PageLoader />;
  }

  return (
    <ConfigContextProvider baseConfig={storyMap.config}>
      <StoryMapUpdate {...props} storyMap={storyMap} />
    </ConfigContextProvider>
  );
};

export default ContextWrapper;
