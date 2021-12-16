import React, { useEffect } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Grid,
  Alert,
  Typography
} from '@mui/material';

import theme from 'theme';
import LoaderCard from 'common/components/LoaderCard';
import { fetchDashboardData } from 'dashboard/dashboardSlice';
import LandscapesCard from 'landscape/components/LandscapesDashboardCard';
import LandscapeDefaultCard from 'landscape/components/LandscapeDefaultDashboardCard';
import GroupsCard from 'group/components/GroupsDashboardCard';
import GroupDefaultCard from 'group/components/GroupDefaultDashboardCard';

const Landscapes = ({ landscapes, fetching }) => {
  if (fetching) {
    return (
      <LoaderCard />
    );
  }

  if (_.isEmpty(landscapes)) {
    return (
      <LandscapeDefaultCard />
    );
  }

  return (
    <LandscapesCard landscapes={landscapes} />
  );
};

const Groups = ({ groups, fetching }) => {
  if (fetching) {
    return (
      <LoaderCard />
    );
  }

  if (_.isEmpty(groups)) {
    return (
      <GroupDefaultCard />
    );
  }

  return (
    <GroupsCard groups={groups} />
  );
};

const Dashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const user = useSelector(state => state.user.user);
  const dashboard = useSelector(state => state.userDashboard);
  const { groups, landscapes, error, fetching } = dashboard;

  useEffect(() => {
    dispatch(fetchDashboardData(user.email));
  }, [dispatch, user]);

  if (error) {
    return (
      <Alert severity="error">
        {t('dashboard.error', { error: t(error) })}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(2)
      }}
    >
      <Typography variant="h1"
        sx={{
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2)
        }}
      >
        {t('dashboard.page_title', { name: user.firstName })}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Landscapes landscapes={landscapes} fetching={fetching} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Groups groups={groups} fetching={fetching} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
