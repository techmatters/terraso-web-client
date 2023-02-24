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
import React, { useCallback, useMemo } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Paper, useMediaQuery } from '@mui/material';

import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import { useAnalytics } from 'monitoring/analytics';
import { ILM_OUTPUT_PROP, LANDSCAPE_NARRATIVES } from 'monitoring/ilm';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';

import { addStoryMap } from 'storyMap/storyMapSlice';

import { MAPBOX_STYLE_DEFAULT } from 'config';

import StoryMapForm from './StoryMapForm';
import {
  StoryMapConfigContextProvider,
  useStoryMapConfigContext,
} from './StoryMapForm/storyMapConfigContext';

import theme from 'theme';

// Chapter schema
// {
//   id: string,
//   title: string,
//   description: RichText,
//   alignment: string (left|right|center),
//   rotateAnimation: boolean,
//   mapAnimation: string (flyTo|jumpTo),
//   media: {
//     type: string (image|video|embedded),
//     url: string,
//     signedUrl: string,
//   },
//   location: {
//     center: {
//       lat: number,
//       lng: number,
//     },
//     zoom: number,
//     pitch: number,
//     bearing: number,
//   },
//   onChapterEnter: [
//    {
//      layer: string,
//      opacity: number,
//    },
//],
//   onChapterExit: [
//    {
//      layer: string,
//      opacity: number,
//    },
//],
// }

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
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { mediaFiles } = useStoryMapConfigContext();

  const save = useCallback(
    (config, published) => {
      dispatch(
        addStoryMap({
          storyMap: {
            config,
            published,
          },
          files: mediaFiles,
        })
      ).then(data => {
        const success = _.get('meta.requestStatus', data) === 'fulfilled';
        if (success) {
          const slug = _.get('payload.slug', data);

          if (published) {
            navigate(`/tools/story-maps/${slug}`);
            trackEvent('Storymap Published', {
              props: {
                url: `${window.location.origin}/tools/story-maps/${slug}`,
                [ILM_OUTPUT_PROP]: LANDSCAPE_NARRATIVES,
              },
            });
            return;
          }

          navigate(`/tools/story-maps/${slug}/edit`);
        }
      });
    },
    [dispatch, navigate, trackEvent, mediaFiles]
  );

  const onPublish = useCallback(config => save(config, true), [save]);
  const onSaveDraft = useCallback(config => save(config, false), [save]);

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
