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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';
import { Paper, useMediaQuery } from '@mui/material';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import { useAnalytics } from 'monitoring/analytics';
import { ILM_OUTPUT_PROP, LANDSCAPE_NARRATIVES } from 'monitoring/ilm';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import { addStoryMap } from 'storyMap/storyMapSlice';
import {
  generateStoryMapEditUrl,
  generateStoryMapUrl,
} from 'storyMap/storyMapUtils';

import StoryMapForm from './StoryMapForm';
import { StoryMapConfigContextProvider } from './StoryMapForm/storyMapConfigContext';

import { MAPBOX_STYLE_DEFAULT } from 'config';

import theme from 'theme';

/*
 * Chapter schema
 * {
 *   id: string,
 *   title: string,
 *   description: RichText,
 *   alignment: string (left|right|center),
 *   rotateAnimation: boolean,
 *   mapAnimation: string (flyTo|jumpTo),
 *   media: {
 *     type: string (image|video|embedded),
 *     url: string,
 *     signedUrl: string,
 *   },
 *   location: {
 *     center: {
 *       lat: number,
 *       lng: number,
 *     },
 *     zoom: number,
 *     pitch: number,
 *     bearing: number,
 *   },
 *   onChapterEnter: [
 *    {
 *      layer: string,
 *      opacity: number,
 *    },
 *   ],
 *   onChapterExit: [
 *    {
 *      layer: string,
 *      opacity: number,
 *    },
 *  ],
 * }
 */

const BASE_CONFIG = {
  style: MAPBOX_STYLE_DEFAULT,
  theme: 'dark',
  showMarkers: false,
  use3dTerrain: true,
  title: '',
  subtitle: '',
  byline: '',
  chapters: [],
};

const StoryMapNew = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const { trackEvent } = useAnalytics();
  const [saved, setSaved] = useState();

  useDocumentTitle(t('storyMap.new_document_title'));

  useEffect(() => {
    const source = locationState?.source || 'direct';
    trackEvent('storymap.start', {
      props: {
        [ILM_OUTPUT_PROP]: LANDSCAPE_NARRATIVES,
        source,
      },
    });
  }, [trackEvent, locationState]);

  useEffect(() => {
    if (!saved) {
      return;
    }
    setSaved(null);
    const { id, slug, storyMapId, published } = saved;
    const url = generateStoryMapUrl({ slug, storyMapId });
    const event = published ? 'storymap.publish' : 'storymap.saveDraft';
    trackEvent(event, {
      props: {
        [ILM_OUTPUT_PROP]: LANDSCAPE_NARRATIVES,
        map: id,
      },
    });
    if (published) {
      navigate(url);
      return;
    }

    navigate(generateStoryMapEditUrl({ slug, storyMapId }));
  }, [dispatch, navigate, trackEvent, saved]);

  const save = useCallback(
    (config, mediaFiles, publish) =>
      dispatch(
        addStoryMap({
          storyMap: {
            config,
            publish,
          },
          files: mediaFiles,
        })
      ).then(data => {
        const success = _.get('meta.requestStatus', data) === 'fulfilled';
        if (success) {
          const slug = _.get('payload.slug', data);
          const storyMapId = _.get('payload.story_map_id', data);
          const id = _.get('payload.id', data);

          setSaved({ id, slug, storyMapId, published: publish });
          return;
        }
        return Promise.reject(data);
      }),
    [dispatch]
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
  const { t } = useTranslation();
  const { data: user } = useSelector(_.get('account.currentUser'));
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  useBreadcrumbsParams(useMemo(() => ({ loading: !isSmall }), [isSmall]));

  if (isSmall) {
    return (
      <PageContainer>
        <PageHeader header={t('storyMap.form_new_mobile_warning_title')} />
        <Paper variant="outlined" sx={{ p: 2 }}>
          {t('storyMap.form_new_mobile_warning')}
        </Paper>
      </PageContainer>
    );
  }

  return (
    <StoryMapConfigContextProvider
      baseConfig={{
        ...BASE_CONFIG,
        byline: t('storyMap.form_byline', { user }),
      }}
    >
      <StoryMapNew {...props} />
    </StoryMapConfigContextProvider>
  );
};

export default ContextWrapper;
