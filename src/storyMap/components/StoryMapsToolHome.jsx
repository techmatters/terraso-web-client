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

import { useMemo } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { Button, Grid, Paper, Typography } from '@mui/material';

import ExternalLink from 'terraso-web-client/common/components/ExternalLink';
import LoaderCard from 'terraso-web-client/common/components/LoaderCard';
import { useDocumentTitle } from 'terraso-web-client/common/document';
import PageContainer from 'terraso-web-client/layout/PageContainer';
import PageHeader from 'terraso-web-client/layout/PageHeader';
import PageLoader from 'terraso-web-client/layout/PageLoader';
import { useBreadcrumbsParams } from 'terraso-web-client/navigation/breadcrumbsContext';
import StoryMapsCard from 'terraso-web-client/storyMap/components/StoryMapsCard';
import { fetchUserStoryMaps } from 'terraso-web-client/storyMap/storyMapSlice';

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
  const { t } = useTranslation();
  const { list, fetching: fetchingStoryMaps } = useSelector(
    _.get('storyMap.userStoryMaps')
  );

  useDocumentTitle(t('storyMap.home_document_title'));
  useBreadcrumbsParams(useMemo(() => ({ loading: false }), []));
  useFetchData(fetchUserStoryMaps);

  return (
    <>
      {fetchingStoryMaps && <PageLoader />}
      <PageContainer maxWidth="lg">
        <PageHeader header={t('storyMap.tool_home_title')} />
        <Grid container spacing={2} sx={{ width: '100%' }}>
          {!_.isEmpty(list) && (
            <Grid size={{ xs: 12, sm: 8 }}>
              <StoryMaps storyMaps={list} fetching={fetchingStoryMaps} />
            </Grid>
          )}
          <Grid size={{ sm: _.isEmpty(list) ? 12 : 4 }}>
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
      </PageContainer>
    </>
  );
};

export default StoryMapsToolsHome;
