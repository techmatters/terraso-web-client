import React from 'react'
import {
  Box,
  CardActions,
  Typography,
  Button
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import theme from 'theme'
import DashboardCard from 'dashboard/components/DashboardCard'

const Avatar = () => (
  <Box
    component="span"
    sx={{
      bgcolor: theme.palette.gray.lite1,
      width: 80,
      height: 80
    }}
  >
  </Box>
)

const Actions = ({ group }) => {
  const { t } = useTranslation()

  if (group.role !== 'manager') {
    return null
  }

  return (
    <CardActions sx={{ padding: 0 }}>
      <Button variant="outlined" sx={{ width: '100%' }} >
        {t('group.edit_profile_button')}
      </Button>
    </CardActions>
  )
}

const GroupDashboardCard = ({ group }) => {
  const { t } = useTranslation()

  return (
    <DashboardCard sx={{ flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', marginBottom: theme.spacing(2) }}>
        <Avatar />
        <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: theme.spacing(2) }}>
          <Typography variant="h5">
            {group.name}
          </Typography>
          <Typography variant="subtitle1">
            {t(`group.role_${group.role}`)}
          </Typography>
        </Box>
      </Box>
      <Actions group={group} />
    </DashboardCard>
  )
}

export default GroupDashboardCard
