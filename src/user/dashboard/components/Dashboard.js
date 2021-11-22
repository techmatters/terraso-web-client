import React, { useEffect } from 'react'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import {
  Box,
  Grid,
  Alert,
  Typography
} from '@mui/material'

import theme from 'theme'
import LoaderCard from 'common/components/LoaderCard'
import { fetchDashboardData } from 'user/dashboard/dashboardSlice'
import UserCard from 'user/components/UserCard'
import LandscapeCard from 'landscape/LandscapeCard'
import LandscapePlaceholderCard from 'landscape/LandscapePlaceholderCard'
import GroupCard from 'group/GroupCard'
import GroupPlaceholderCard from 'group/GroupPlaceholderCard'

const Landscapes = ({ landscapes, fetching }) => {
  if (fetching) {
    return (
      <Grid item xs={12} md={6}>
        <LoaderCard />
      </Grid>
    )
  }

  if (_.isEmpty(landscapes)) {
    return (
      <Grid item xs={12} md={6}>
        <LandscapePlaceholderCard />
      </Grid>
    )
  }

  return landscapes.map(landscape => (
    <Grid key={landscape.id} item xs={12} md={6}>
      <LandscapeCard landscape={landscape} />
    </Grid>
  ))
}

const Groups = ({ groups, fetching }) => {
  if (fetching) {
    return (
      <Grid item xs={12} md={6}>
        <LoaderCard />
      </Grid>
    )
  }

  if (_.isEmpty(groups)) {
    return (
      <Grid item xs={12} md={6}>
        <GroupPlaceholderCard />
      </Grid>
    )
  }

  return groups.map(group => (
    <Grid key={group.id} item xs={12} md={6}>
      <GroupCard group={group} />
    </Grid>
  ))
}

const Dashboard = props => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const user = useSelector(state => state.user.user)
  const dashboard = useSelector(state => state.userDashboard)
  const { groups, landscapes, error, fetching } = dashboard

  useEffect(() => {
    dispatch(fetchDashboardData())
  }, [dispatch])

  if (error) {
    return (
      <Alert severity="error">
        {t('dashboard.error', { error })}
      </Alert>
    )
  }

  return (
    <Box sx={{ padding: theme.spacing(2) }}>
      <Typography variant="h1" component="div" color='text.primary' gutterBottom>
        {t('dashboard.page_title')}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <UserCard user={user} />
        </Grid>
        <Landscapes landscapes={landscapes} fetching={fetching} />
        <Groups groups={groups} fetching={fetching} />
      </Grid>
    </Box>
  )
}

export default Dashboard
