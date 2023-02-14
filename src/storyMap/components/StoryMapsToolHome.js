import React, { useMemo } from 'react';

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Paper,
  Typography,
} from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import RouterLink from 'common/components/RouterLink';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import { formatDate } from 'localization/utils';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import { useFetchData } from 'state/utils';

import { fetchSamples } from 'storyMap/storyMapSlice';

const StoryMapsToolsHome = () => {
  const { t, i18n } = useTranslation();
  const { list } = useSelector(_.get('storyMap.samples'));

  useBreadcrumbsParams(useMemo(() => ({ loading: false }), []));

  useFetchData(fetchSamples);

  return (
    <>
      <PageContainer maxWidth="md">
        <PageHeader header={t('storyMap.tool_home_title')} />

        <Paper variant="outlined" sx={{ bgcolor: 'gray.lite2', p: 2 }}>
          <Typography variant="body1">
            {t('storyMap.tool_home_description')}
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/tools/story-maps/create"
            sx={{ mt: 2, mb: 3 }}
          >
            {t('storyMap.tool_home_create_button')}
          </Button>
          <Trans i18nKey="storyMap.tool_home_help">
            <Typography>Question</Typography>
            <Typography>
              Prefix
              <ExternalLink href={t('storyMap.tool_home_help_video_url')}>
                Help 1
              </ExternalLink>
              link
              <ExternalLink href={t('storyMap.tool_home_help_document_url')}>
                Help 2
              </ExternalLink>
            </Typography>
          </Trans>
        </Paper>
        {!_.isEmpty(list) && (
          <>
            <Typography variant="h2" sx={{ mt: 4, mb: 2 }}>
              {t('storyMap.tool_home_examples_title')}
            </Typography>
            <Grid container spacing={1}>
              {list.map(sample => (
                <Grid item xs={12} sm={6} md={4} key={sample.id}>
                  <Card>
                    <CardHeader
                      title={
                        <RouterLink
                          variant="h3"
                          to={`/tools/story-maps/${sample.slug}`}
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
                      {t('storyMap.tool_home_examples_by', {
                        user: sample.createdBy,
                      })}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </PageContainer>
    </>
  );
};

export default StoryMapsToolsHome;
