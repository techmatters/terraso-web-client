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

import React, { useMemo } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';
import { useFetchData } from 'terraso-client-shared/store/utils';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  GridLegacy as Grid,
  List,
  Paper,
  Typography,
} from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import LoaderCard from 'common/components/LoaderCard';
import RouterLink from 'common/components/RouterLink';
import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { formatDate } from 'localization/utils';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import { fetchSamples } from 'storyMap/storyMapSlice';
import { generateStoryMapUrl } from 'storyMap/storyMapUtils';

import StoryMapsCard from './StoryMapsCard';

const StoryMaps = ({ storyMaps, fetching }) => {
  const { t } = useTranslation();
  const { data: user } = useSelector(_.get('account.currentUser'));
  const possession = user.firstName.slice(-1) === 's' ? "'" : "'s";

  if (fetching) {
    return <LoaderCard />;
  }

  if (_.isEmpty(storyMaps)) {
    return;
  }

  return (
    <StoryMapsCard
      showCreate={false}
      storyMaps={storyMaps}
      title={t('storyMap.story_maps_title', {
        name: user.firstName,
        possession: possession,
      })}
    />
  );
};

const StoryMapsToolsHome = () => {
  const { t, i18n } = useTranslation();
  const { listSamples, fetching: fetchingSamples } = useSelector(
    _.get('storyMap.samples')
  );
  const { list, fetching: fetchingStoryMaps } = useSelector(
    _.get('storyMap.userStoryMaps')
  );

  useDocumentTitle(t('storyMap.home_document_title'));
  useBreadcrumbsParams(useMemo(() => ({ loading: false }), []));
  useFetchData(fetchSamples);

  return (
    <>
      {(fetchingStoryMaps || fetchingSamples) && <PageLoader />}
      <PageContainer maxWidth="lg">
        <PageHeader header={t('storyMap.tool_home_title')} />
        <Grid container spacing={2}>
          {!_.isEmpty(list) && (
            <Grid item xs={12} sm={8}>
              <StoryMaps storyMaps={list} fetching={fetchingStoryMaps} />
            </Grid>
          )}
          <Grid item sm={_.isEmpty(list) ? 12 : 4}>
            <Paper
              variant="outlined"
              sx={{ bgcolor: 'white', p: 2, borderRadius: '8px' }}
            >
              <Typography variant="body1">
                {t('storyMap.tool_home_description')}
              </Typography>
              <Button
                variant="contained"
                component={Link}
                to="/tools/story-maps/new"
                state={{ source: 'story_maps_page' }}
                sx={{ mt: 2, mb: 3 }}
              >
                {t('storyMap.tool_home_create_button')}
              </Button>
              <Trans i18nKey="storyMap.tool_home_help">
                <Typography>
                  Question
                  <ExternalLink
                    href={t('storyMap.tool_home_help_document_url')}
                    underlined={true}
                  >
                    <u>Help</u>
                  </ExternalLink>
                </Typography>
              </Trans>
            </Paper>
          </Grid>
        </Grid>
        {!_.isEmpty(listSamples) && (
          <section aria-labelledby="story-map-examples-heading">
            <Typography
              id="story-map-examples-heading"
              variant="h2"
              sx={{ mt: 4, mb: 2 }}
            >
              {t('storyMap.tool_home_examples_title')}
            </Typography>
            <Grid
              container
              spacing={2}
              component={List}
              aria-labelledby="story-map-examples-heading"
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  md: 'repeat(3, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  xs: '1fr',
                },
              }}
            >
              {listSamples.map(sample => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={sample.id}
                  component="li"
                  aria-labelledby={`story-map-example-${sample.id}`}
                  style={{
                    maxWidth: '100%',
                  }}
                >
                  <Card sx={{ height: '100%' }}>
                    <CardHeader
                      title={
                        <RouterLink
                          variant="h3"
                          id={`story-map-example-${sample.id}`}
                          to={generateStoryMapUrl(sample)}
                          sx={{ fontSize: '1.25rem' }}
                        >
                          {sample.title}
                        </RouterLink>
                      }
                      subheader={
                        sample.publishedAt && (
                          <Typography variant="caption">
                            {t('storyMap.tool_home_examples_published_at', {
                              date: formatDate(
                                i18n.resolvedLanguage,
                                sample.publishedAt
                              ),
                            })}
                          </Typography>
                        )
                      }
                    />
                    <CardContent sx={{ pt: 0 }}>
                      <Typography>
                        {t('storyMap.tool_home_examples_by', {
                          user: sample.createdBy,
                        })}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </section>
        )}
      </PageContainer>
    </>
  );
};

export default StoryMapsToolsHome;
