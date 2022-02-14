import React, { useEffect } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Grid, Alert, Stack } from '@mui/material';

import { fetchHomeData } from 'home/homeSlice';
import { useDocumentTitle } from 'common/document';
import LoaderCard from 'common/components/LoaderCard';
import LandscapesCard from 'landscape/components/LandscapesHomeCard';
import LandscapeDefaultCard from 'landscape/components/LandscapeDefaultHomeCard';
import GroupsCard from 'group/components/GroupsHomeCard';
import GroupDefaultCard from 'group/components/GroupDefaultHomeCard';
import ToolHomeCard from 'tool/components/ToolHomeCard';
import PageHeader from 'layout/PageHeader';
import PageContainer from 'layout/PageContainer';

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
  const dispatch = useDispatch();

  const { data: user } = useSelector(state => state.account.currentUser);
  const home = useSelector(state => state.userHome);
  const { groups, landscapes, error, fetching } = home;

  useDocumentTitle(t('home.document_title'), false, true);

  useEffect(() => {
    dispatch(fetchHomeData(user.email));
  }, [dispatch, user]);

  if (error) {
    return (
      <Alert severity="error">{t('home.error', { error: t(error) })}</Alert>
    );
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
