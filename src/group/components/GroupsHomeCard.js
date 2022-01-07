import React from 'react'
import _ from 'lodash'
import {
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

const GroupItem = ({ group }) => {
  const { t } = useTranslation()
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', padding: theme.spacing(1) }}>
      <Link
        component={RouterLink}
        underline="none"
        to={`/groups/${group.slug}`}
      >
        {group.name}
      </Link>
      <Typography variant="subtitle1" sx={{ marginTop: theme.spacing(3) }}>
        {t(`group.role_${_.get(group, 'role', 'member')}`)}
      </Typography>
    </Box>
  )
}

const GroupsHomeCard = ({ groups }) => {
  const { t } = useTranslation()
  return (
    <HomeCard sx={{ flexDirection: 'column' }}>
      <Typography variant="h5" sx={{ padding: theme.spacing(2) }}>
        {t('group.home_title')}
      </Typography>
      <List>
        {groups
          .map((group, index) => (
            <React.Fragment key={group.slug}>
              <ListItem>
                <GroupItem group={group} />
              </ListItem>
              {index !== groups.length - 1
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
          to="/groups"
          sx={{ width: '100%' }}
        >
          {t('group.home_connect_label').toUpperCase()}
        </Button>
      </CardActions>
    </HomeCard>
  )
}

export default GroupsHomeCard
