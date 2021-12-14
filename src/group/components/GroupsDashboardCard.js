import React from 'react'
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

import DashboardCard from 'dashboard/components/DashboardCard'
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
        {t(`group.role_${group.role || 'member'}`)}
      </Typography>
    </Box>
  )
}

const GroupsDashboardCard = ({ groups }) => {
  const { t } = useTranslation()
  return (
    <DashboardCard sx={{ flexDirection: 'column' }}>
      <Typography variant="h5" sx={{ padding: theme.spacing(2) }}>
        {t('group.dashboard_title')}
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
          {t('group.dashboard_connect_label').toUpperCase()}
        </Button>
      </CardActions>
    </DashboardCard>
  )
}

export default GroupsDashboardCard
