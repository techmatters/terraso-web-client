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
import { StoryMapConfigContextProvider } from './StoryMapForm/storyMapConfigContext';

const StoryMapUpdate = props => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const { storyMap } = props;

  const onPublish = useCallback(
    (config, mediaFiles) => {
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
    [dispatch, navigate, trackEvent, storyMap?.id]
  );

  const onSaveDraft = useCallback(
    (config, mediaFiles) => {
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
    [dispatch, storyMap?.id]
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
    <StoryMapConfigContextProvider baseConfig={storyMap.config}>
      <StoryMapUpdate {...props} storyMap={storyMap} />
    </StoryMapConfigContextProvider>
  );
};

export default ContextWrapper;
