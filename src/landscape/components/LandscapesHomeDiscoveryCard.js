import React from 'react'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { Link, List, ListItem, Typography } from '@mui/material'

import HomeCard from 'home/components/HomeCard'
import LoaderCard from 'common/components/LoaderCard'
import theme from 'theme'

const LandscapesHomeDiscoveryCard = props => {
  const { t } = useTranslation()
  const { landscapes, fetching } = props

  if (fetching) {
    return (
      <LoaderCard />
    )
  }

  if (_.isEmpty(landscapes)) {
    return null
  }

  return (
    <HomeCard
      sx={{
        flexDirection: 'column',
        padding: theme.spacing(2)
      }}
    >
      <Typography variant="h5">
        {t('landscape.home_discovery_title')}
      </Typography>
      <List>
        {landscapes.slice(0, 5).map(landscape => (
          <ListItem
            key={landscape.slug}
            sx={{ padding: 0, paddingBottom: theme.spacing(1) }}
          >
            <Link
              variant="cbody1"
              component={RouterLink}
              to={`/landscapes/${landscape.slug}`}
            >
              {landscape.name}
            </Link>
          </ListItem>
        ))}
      </List>
    </HomeCard>
  )
}

export default LandscapesHomeDiscoveryCard
