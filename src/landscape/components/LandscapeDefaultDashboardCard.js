import React from 'react'
import {
  Box,
  CardActions,
  Typography,
  Button,
  Alert
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import DashboardCard from 'dashboard/components/DashboardCard'
import { Link } from 'react-router-dom'
import theme from 'theme'

const Actions = () => {
  const { t } = useTranslation()

  return (
    <CardActions sx={{ padding: 0 }}>
      <Button
        variant="outlined"
        component={Link}
        to="/landscapes"
        sx={{ width: '100%' }}
      >
        {t('landscape.default_connect_button')}
      </Button>
    </CardActions>
  )
}

const LandscapeDefaultDashboardCard = () => {
  const { t } = useTranslation()

  return (
    <DashboardCard sx={{ flexDirection: 'column', padding: theme.spacing(2) }}>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5">
          {t('landscape.dashboard_default_title')}
        </Typography>
        <Alert
          severity="info"
          sx={{
            marginTop: theme.spacing(1),
            marginBottom: theme.spacing(1)
          }}
        >
          <Typography variant="body1">
            {t('landscape.default_content')}
          </Typography>
        </Alert>
      </Box>
      <Actions />
    </DashboardCard>
  )
}

export default LandscapeDefaultDashboardCard
