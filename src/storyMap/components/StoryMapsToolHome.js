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
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useFetchData } from 'terraso-client-shared/store/utils';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
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
import { formatDate } from 'localization/utils';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import { fetchSamples, removeUserStoryMap } from 'storyMap/storyMapSlice';
import { generateStoryMapUrl } from 'storyMap/storyMapUtils';

import StoryMapsHomeCard from './StoryMapsHomeCard';

const StoryMaps = ({ storyMaps, fetching }) => {
  const dispatch = useDispatch();
  const onDeleteSuccess = useCallback(
    storyMap => dispatch(removeUserStoryMap(storyMap.id)),
    [dispatch]
  );

  if (fetching) {
    return <LoaderCard />;
  }

  if (_.isEmpty(storyMaps)) {
    return;
  }

  return (
    <StoryMapsHomeCard
      onDeleteSuccess={onDeleteSuccess}
      hasAction={false}
      storyMaps={storyMaps}
      sx={{ width: '75%' }}
    />
  );
};

const StoryMapsToolsHome = () => {
  const { t, i18n } = useTranslation();
  const { listSamples } = useSelector(_.get('storyMap.samples'));
  const { listUserStoryMaps, fetching } = useSelector(
    _.get('storyMap.userStoryMaps')
  );
  useDocumentTitle(t('storyMap.home_document_title'));

  useBreadcrumbsParams(useMemo(() => ({ loading: false }), []));

  useFetchData(fetchSamples);
  return (
    <>
      <PageContainer maxWidth="md">
        <PageHeader header={t('storyMap.tool_home_title')} />
        <Box
          sx={{
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexGrow: 5,
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={listUserStoryMaps.length === 0 ? 0 : 7}>
              <StoryMaps storyMaps={listUserStoryMaps} fetching={fetching} />
            </Grid>
            <Grid item xs={listUserStoryMaps.length === 0 ? 12 : 5}>
              <Paper variant="outlined" sx={{ bgcolor: 'white', p: 2 }}>
                <Typography variant="body1">
                  {t('storyMap.tool_home_description')}
                </Typography>
                <Button
                  variant="contained"
                  component={Link}
                  to="/tools/story-maps/new"
                  sx={{ mt: 2, mb: 3 }}
                >
                  {t('storyMap.tool_home_create_button')}
                </Button>
                <Trans i18nKey="storyMap.tool_home_help">
                  <Typography>
                    Question
                    <ExternalLink
                      href={t('storyMap.tool_home_help_document_url')}
                    >
                      Help
                    </ExternalLink>
                  </Typography>
                </Trans>
              </Paper>
            </Grid>
          </Grid>
        </Box>
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
