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
import React, { useCallback, useEffect, useState } from 'react';
import _ from 'lodash/fp';
import { usePermission } from 'permissions';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useFetchData } from 'terraso-client-shared/store/utils';

import { useDocumentTitle } from 'common/document';
import NotFound from 'layout/NotFound';
import PageLoader from 'layout/PageLoader';
import { useAnalytics } from 'monitoring/analytics';
import { ILM_OUTPUT_PROP, LANDSCAPE_NARRATIVES } from 'monitoring/ilm';
import {
  fetchStoryMapForm,
  resetForm,
  updateStoryMap,
} from 'storyMap/storyMapSlice';
import {
  generateStoryMapEditUrl,
  generateStoryMapUrl,
} from 'storyMap/storyMapUtils';

import StoryMapForm from './StoryMapForm';
import { StoryMapConfigContextProvider } from './StoryMapForm/storyMapConfigContext';

const StoryMapUpdate = props => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { storyMap } = props;
  const [saved, setSaved] = useState();

  useDocumentTitle(
    t('storyMap.edit_document_title', {
      name: _.get('title', storyMap),
    }),
    saved
  );

  useEffect(() => {
    if (!saved) {
      return;
    }

    const { title, slug, storyMapId, published } = saved;
    setSaved(null);
    const url = generateStoryMapUrl({ slug, storyMapId });

    const event = published
      ? storyMap.isPublished
        ? 'storymap.update'
        : 'storymap.publish'
      : 'storymap.saveDraft';

    trackEvent(event, {
      props: {
        url: `${window.location.origin}${url}`,
        [ILM_OUTPUT_PROP]: LANDSCAPE_NARRATIVES,
      },
    });
    if (published) {
      navigate(url);
      return;
    }

    if (title !== storyMap?.title) {
      navigate(generateStoryMapEditUrl({ slug, storyMapId }));
    }
  }, [storyMap, navigate, trackEvent, saved]);

  const save = useCallback(
    (config, mediaFiles, published) =>
      dispatch(
        updateStoryMap({
          storyMap: {
            id: storyMap?.id,
            config,
            published,
          },
          files: mediaFiles,
        })
      ).then(data => {
        const success = _.get('meta.requestStatus', data) === 'fulfilled';
        if (success) {
          const slug = _.get('payload.slug', data);
          const storyMapId = _.get('payload.story_map_id', data);
          const title = _.get('payload.title', data);

          setSaved({
            title,
            slug,
            storyMapId,
            published,
          });
          return;
        }
        return Promise.reject(data);
      }),
    [storyMap?.id, dispatch]
  );
  const onPublish = useCallback(
    (config, mediaFiles) => save(config, mediaFiles, true),
    [save]
  );
  const onSaveDraft = useCallback(
    (config, mediaFiles) => save(config, mediaFiles, false),
    [save]
  );

  return <StoryMapForm onPublish={onPublish} onSaveDraft={onSaveDraft} />;
};

const ContextWrapper = props => {
  const { slug, storyMapId } = useParams();
  const dispatch = useDispatch();
  const { fetching, data: storyMap } = useSelector(_.get('storyMap.form'));
  const { loading: loadingPermissions, allowed } = usePermission(
    'storyMap.change',
    storyMap
  );

  useEffect(() => {
    dispatch(resetForm());
  }, [dispatch]);

  useFetchData(
    useCallback(
      () => fetchStoryMapForm({ slug, storyMapId }),
      [slug, storyMapId]
    )
  );

  if (fetching || loadingPermissions) {
    return <PageLoader />;
  }

  if (!storyMap || !allowed) {
    return <NotFound />;
  }

  return (
    <StoryMapConfigContextProvider
      baseConfig={storyMap.config}
      storyMap={storyMap}
    >
      <StoryMapUpdate {...props} storyMap={storyMap} />
    </StoryMapConfigContextProvider>
  );
};

export default ContextWrapper;
