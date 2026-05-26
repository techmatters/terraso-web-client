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

import { useCallback, useEffect, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { useFetchData } from 'terraso-client-shared/store/utils';

import { useDocumentTitle } from 'terraso-web-client/common/document';
import NotFound from 'terraso-web-client/layout/NotFound';
import PageLoader from 'terraso-web-client/layout/PageLoader';
import { useAnalytics } from 'terraso-web-client/monitoring/analytics';
import {
  ILM_OUTPUT_PROP,
  LANDSCAPE_NARRATIVES,
} from 'terraso-web-client/monitoring/ilm';
import { usePermission } from 'terraso-web-client/permissions/index';
import StoryMapForm from 'terraso-web-client/storyMap/components/StoryMapForm/index';
import {
  StoryMapConfigContextProvider,
  useStoryMapConfigDataContext,
  useStoryMapSaveContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import {
  fetchStoryMapForm,
  resetForm,
  updateStoryMap,
} from 'terraso-web-client/storyMap/storyMapSlice';
import {
  generateStoryMapEditUrl,
  generateStoryMapUrl,
} from 'terraso-web-client/storyMap/storyMapUtils';

const getStoryMapSaveEvent = ({ publish, isPublished }) => {
  if (!publish) {
    return 'storymap.saveDraft';
  }

  return isPublished ? 'storymap.update' : 'storymap.publish';
};

const buildSavedStoryMapState = ({ data, publish }) => ({
  id: _.get('payload.id', data),
  title: _.get('payload.title', data),
  slug: _.get('payload.slug', data),
  storyMapId: _.get('payload.story_map_id', data),
  published: publish,
});

const StoryMapUpdate = props => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const [savedStoryMap, setSavedStoryMap] = useState();
  const { storyMap } = useStoryMapConfigDataContext();
  const { applySavedRevisionConfig } = useStoryMapSaveContext();

  useDocumentTitle(
    t('storyMap.edit_document_title', {
      name: _.get('title', storyMap),
    }),
    savedStoryMap
  );

  useEffect(() => {
    if (!savedStoryMap) {
      return;
    }

    const { slug, storyMapId, published } = savedStoryMap;
    setSavedStoryMap(null);
    const url = generateStoryMapUrl({ slug, storyMapId });

    const event = getStoryMapSaveEvent({
      publish: published,
      isPublished: storyMap.isPublished,
    });

    trackEvent(event, {
      props: {
        [ILM_OUTPUT_PROP]: LANDSCAPE_NARRATIVES,
        map: storyMap.id,
      },
    });
    if (published) {
      navigate(url, { force: true });
      return;
    }

    window.history.replaceState(
      null,
      t('storyMap.edit_document_title', {
        name: _.get('title', storyMap),
      }),
      generateStoryMapEditUrl({ slug, storyMapId })
    );
  }, [storyMap, navigate, trackEvent, savedStoryMap, t, dispatch]);

  const persistStoryMapUpdate = useCallback(
    (config, mediaFiles, publish, revision) =>
      dispatch(
        updateStoryMap({
          storyMap: {
            id: storyMap?.id,
            config,
            publish,
          },
          files: mediaFiles,
        })
      ).then(data => {
        const success = _.get('meta.requestStatus', data) === 'fulfilled';
        if (success) {
          if (!publish) {
            const savedConfig = _.get('payload.configuration', data);

            const didApplySavedRevisionConfig = applySavedRevisionConfig(
              revision,
              savedConfig
            );
            if (!didApplySavedRevisionConfig) {
              return false;
            }
          }

          setSavedStoryMap(buildSavedStoryMapState({ data, publish }));
          return true;
        }
        return Promise.reject(data);
      }),
    [storyMap?.id, applySavedRevisionConfig, dispatch]
  );
  const onPublish = useCallback(
    (config, mediaFiles, revision) =>
      persistStoryMapUpdate(config, mediaFiles, true, revision),
    [persistStoryMapUpdate]
  );
  const onSaveDraft = useCallback(
    (config, mediaFiles, revision) =>
      persistStoryMapUpdate(config, mediaFiles, false, revision),
    [persistStoryMapUpdate]
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
      <StoryMapUpdate {...props} />
    </StoryMapConfigContextProvider>
  );
};

export default ContextWrapper;
