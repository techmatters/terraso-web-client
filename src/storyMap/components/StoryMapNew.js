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
  ConfigContextProvider,
  useConfigContext,
} from './StoryMapForm/configContext';

import theme from 'theme';

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
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { mediaFiles } = useConfigContext();

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
    <ConfigContextProvider
      baseConfig={{
        ...BASE_CONFIG,
        byline: t('storyMap.form_byline', { user }),
      }}
    >
      <StoryMapNew {...props} />
    </ConfigContextProvider>
  );
};

export default ContextWrapper;
