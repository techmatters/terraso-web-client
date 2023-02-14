import React, { useCallback, useEffect } from 'react';

import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import PageLoader from 'layout/PageLoader';
import { useAnalytics } from 'monitoring/analytics';
import { ILM_OUTPUT_PROP, LANDSCAPE_NARRATIVES } from 'monitoring/ilm';
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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const { storyMap } = props;
  const { mediaFiles } = useConfigContext();

  const onPublish = useCallback(
    config => {
      dispatch(
        updateStoryMap({
          storyMap: {
            id: storyMap?.id,
            config,
            published: true,
          },
          files: mediaFiles,
        })
      ).then(data => {
        const success = _.get('meta.requestStatus', data) === 'fulfilled';
        if (success) {
          const slug = _.get('payload.slug', data);
          navigate(`/tools/story-maps/${slug}`);
          trackEvent('Storymap Published', {
            props: {
              url: `${window.location.origin}/tools/story-maps/${slug}`,
              [ILM_OUTPUT_PROP]: LANDSCAPE_NARRATIVES,
            },
          });
        }
      });
    },
    [dispatch, navigate, trackEvent, storyMap?.id, mediaFiles]
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
  const { loading: loadingPermissions, allowed } = usePermission(
    'storyMap.change',
    storyMap
  );

  useEffect(() => {
    dispatch(resetForm());
  }, [dispatch]);

  useFetchData(useCallback(() => fetchStoryMapForm({ slug }), [slug]));

  if (fetching || loadingPermissions) {
    return <PageLoader />;
  }

  if (!storyMap || !allowed) {
    return null;
  }

  return (
    <ConfigContextProvider baseConfig={storyMap.config}>
      <StoryMapUpdate {...props} storyMap={storyMap} />
    </ConfigContextProvider>
  );
};

export default ContextWrapper;
