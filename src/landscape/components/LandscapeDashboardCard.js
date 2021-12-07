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

const Actions = ({ landscape }) => {
  const { t } = useTranslation()

  if (landscape.role !== 'manager') {
    return null
  }

  return (
    <CardActions sx={{ padding: 0 }}>
      <Button variant="outlined" sx={{ width: '100%' }}>
        {t('landscape.edit_profile_button')}
      </Button>
    </CardActions>
  )
}

const LandscapeDashboardCard = ({ landscape }) => {
  const { t } = useTranslation()

  return (
    <DashboardCard sx={{ flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', marginBottom: theme.spacing(2) }}>
        <Avatar />
        <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: theme.spacing(2) }}>
          <Typography variant="h5">
            {landscape.name}
          </Typography>
          <Typography variant="subtitle1">
            {t(`landscape.role_${landscape.role}`)}
          </Typography>
        </Box>
      </Box>
      <Actions landscape={landscape} />
    </DashboardCard>
  )
}

export default LandscapeDashboardCard
