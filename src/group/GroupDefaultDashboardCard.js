import React from 'react'
import {
  Box,
  CardActions,
  Typography,
  Button,
  Alert
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import theme from 'theme'
import DashboardCard from 'dashboard/components/DashboardCard'

const Actions = () => {
  const { t } = useTranslation()

  return (
    <CardActions sx={{ padding: 0 }}>
      <Button
        variant="outlined"
        sx={{ width: '100%' }}
      >
        {t('group.default_connect_button')}
      </Button>
    </CardActions>
  )
}

const GroupDefaultDashboardCard = () => {
  const { t } = useTranslation()

  return (
    <DashboardCard sx={{ flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5">
          {t('group.default_title')}
        </Typography>
        <Alert
          severity="info"
          sx={{
            marginTop: theme.spacing(1),
            marginBottom: theme.spacing(1)
          }}
        >
          <Typography variant="body1">
            {t('group.default_content')}
          </Typography>
        </Alert>
      </Box>
      <Actions />
    </DashboardCard>
  )
}

export default GroupDefaultDashboardCard
