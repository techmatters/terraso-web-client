import React, { useEffect } from 'react'
import { Typography } from '@mui/material'
import { FormattedMessage } from 'react-intl'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Grid, Alert } from '@mui/material'

import theme from '../../theme'
import { fetchDashboardData } from '../dashboardSlice'
import UserCard from '../../user/components/UserCard'
import LandscapeCard from '../../landscape/LandscapeCard'
import GroupCard from '../../group/GroupCard'
import Loader from '../../common/Loader'

const Dashboard = props => {
  const dispatch = useDispatch()

  const user = useSelector(state => state.user.user)
  const { groups, landscapes, error, fetching } = useSelector(state => state.dashboard)

  useEffect(() => {
    dispatch(fetchDashboardData())
  }, [dispatch])

  if (fetching) {
    return (<Loader />)
  }

  if (error) {
    return (
      <Alert severity="error">
        <FormattedMessage id="dashboard.error" values={{ error }} /> 
      </Alert>
    )
  }

  return (
    <Box sx={{ padding: theme.spacing(2) }}>
      <Typography variant="h1" component="div" color='text.primary' gutterBottom>
        <FormattedMessage id="dashboard.page_title" />
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <UserCard user={user} />
        </Grid>
        {landscapes.map(landscape => (
          <Grid key={landscape.id} item xs={12} md={6}>
            <LandscapeCard landscape={landscape} />
          </Grid>
        ))}
        {groups.map(group => (
          <Grid key={group.id} item xs={12} md={6}>
            <GroupCard group={group} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default Dashboard