import React, { useCallback, useEffect } from 'react';

import Cookies from 'js-cookie';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Alert, Grid, Stack } from '@mui/material';

import LoaderCard from 'common/components/LoaderCard';
import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import { useAnalytics } from 'monitoring/analytics';
import { useFetchData } from 'state/utils';

import GroupDefaultCard from 'group/components/GroupDefaultHomeCard';
import GroupsCard from 'group/components/GroupsHomeCard';
import { fetchHomeData } from 'home/homeSlice';
import LandscapeDefaultCard from 'landscape/components/LandscapeDefaultHomeCard';
import LandscapesCard from 'landscape/components/LandscapesHomeCard';
import ToolHomeCard from 'tool/components/ToolHomeCard';

const Landscapes = ({ landscapes, fetching }) => {
  if (fetching) {
    return <LoaderCard />;
  }

  if (_.isEmpty(landscapes)) {
    return <LandscapeDefaultCard />;
  }

  return <LandscapesCard landscapes={landscapes} />;
};

const Groups = ({ groups, fetching }) => {
  if (fetching) {
    return <LoaderCard />;
  }

  if (_.isEmpty(groups)) {
    return <GroupDefaultCard />;
  }

  return <GroupsCard groups={groups} />;
};

const Home = () => {
  const { t } = useTranslation();

  const { data: user } = useSelector(state => state.account.currentUser);
  const home = useSelector(state => state.userHome);
  const { groups, landscapes, error, fetching } = home;

  const { trackEvent } = useAnalytics();

  useDocumentTitle(t('home.document_title'), false, true);

  useFetchData(useCallback(() => fetchHomeData(user.email), [user.email]));

  useEffect(() => {
    const service = Cookies.get('new_signup');
    if (service) {
      trackEvent('Account created', {
        props: { service },
        callback: () => Cookies.remove('new_signup'),
      });
    }
  }, [trackEvent]);

  if (error) {
    return <Alert severity="error">{t('home.error', { error })}</Alert>;
  }

  return (
    <PageContainer>
      <PageHeader header={t('home.page_title', { name: user.firstName })} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Stack spacing={1}>
            <Landscapes landscapes={landscapes} fetching={fetching} />
            <ToolHomeCard />
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack spacing={1}>
            <Groups groups={groups} fetching={fetching} />
          </Stack>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Home;
