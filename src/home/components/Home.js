import React, { useEffect } from 'react'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import {
  Box,
  Grid,
  Alert,
  Typography,
  Stack
} from '@mui/material'

import LoaderCard from 'common/components/LoaderCard'
import { fetchHomeData } from 'home/homeSlice'
import LandscapesCard from 'landscape/components/LandscapesHomeCard'
import LandscapeDefaultCard from 'landscape/components/LandscapeDefaultHomeCard'
import GroupsCard from 'group/components/GroupsHomeCard'
import GroupDefaultCard from 'group/components/GroupDefaultHomeCard'
import ToolHomeCard from 'tool/components/ToolHomeCard'
import LandscapesHomeDiscoveryCard from 'landscape/components/LandscapesHomeDiscoveryCard'
import theme from 'theme'

const Landscapes = ({ landscapes, fetching }) => {
  if (fetching) {
    return (
      <LoaderCard />
    )
  }

  if (_.isEmpty(landscapes)) {
    return (
      <LandscapeDefaultCard />
    )
  }

  return (
    <LandscapesCard landscapes={landscapes} />
  )
}

const Groups = ({ groups, fetching }) => {
  if (fetching) {
    return (
      <LoaderCard />
    )
  }

  if (_.isEmpty(groups)) {
    return (
      <GroupDefaultCard />
    )
  }

  return (
    <GroupsCard groups={groups} />
  )
}

const Home = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const { data: user } = useSelector(state => state.account.currentUser)
  const home = useSelector(state => state.userHome)
  const { groups, landscapes, landscapesDiscovery, error, fetching } = home

  useEffect(() => {
    dispatch(fetchHomeData(user.email))
  }, [dispatch, user])

  if (error) {
    return (
      <Alert severity="error">
        {t('home.error', { error: t(error) })}
      </Alert>
    )
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
        {t('home.page_title', { name: user.firstName })}
      </Typography>
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
            <LandscapesHomeDiscoveryCard
              fetching={fetching}
              landscapes={landscapesDiscovery}
            />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Home
