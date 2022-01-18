import React from 'react'
import _ from 'lodash'
import {
  Avatar,
  Box,
  Button,
  CardActions,
  Divider,
  Link,
  List,
  ListItem,
  Typography
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'

import HomeCard from 'home/components/HomeCard'
import theme from 'theme'

const getAcronym = name => name
  .match(/\b(\w)/g)
  .join('')

const LandscapeItem = ({ landscape }) => {
  const { t } = useTranslation()
  return (
    <List sx={{ display: 'flex', padding: theme.spacing(1) }}>
      <Avatar sx={{ width: 80, height: 80 }} variant="square">
        {getAcronym(landscape.name).toUpperCase()}
      </Avatar>
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: theme.spacing(2) }}>
        <Link
          component={RouterLink}
          underline="none"
          to={`/landscapes/${landscape.slug}`}
        >
          {landscape.name}
        </Link>
        {t(`landscape.role_${_.get(landscape, 'role', 'member')}`)}
      </Box>
    </List>
  )
}

const LandscapesHomeCard = ({ landscapes }) => {
  const { t } = useTranslation()
  return (
    <HomeCard sx={{ flexDirection: 'column' }}>
      <Typography variant="h5" sx={{ padding: theme.spacing(2) }}>
        {t('landscape.home_title')}
      </Typography>
      <List>
        {landscapes
          .map((landscape, index) => (
            <React.Fragment key={landscape.slug}>
              <ListItem>
                <LandscapeItem landscape={landscape} />
              </ListItem>
              {index !== landscapes.length - 1
                ? <Divider sx={{ margin: theme.spacing(2) }} />
                : null
              }
            </React.Fragment>
          ))
        }
      </List>
      <Divider />
      <CardActions>
        <Button
          component={RouterLink}
          to="/landscapes"
          sx={{ width: '100%' }}
        >
          {t('landscape.home_connect_label').toUpperCase()}
        </Button>
      </CardActions>
    </HomeCard>
  )
}

export default LandscapesHomeCard
