import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { Link, Stack, Typography } from '@mui/material'

import DashboardCard from 'dashboard/components/DashboardCard'
import theme from 'theme'

const ToolDashboardCard = () => {
  const { t } = useTranslation()
  return (
    <DashboardCard
      sx={{
        flexDirection: 'column',
        padding: theme.spacing(2)
      }}
    >
      <Typography variant="h5">
        {t('tool.dashboard_card_title')}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          marginTop: theme.spacing(2),
          marginBottom: theme.spacing(2)
        }}
      >
        {t('tool.dashboard_card_description')}
      </Typography>
      <Stack direction="row" spacing={3}>
        <img
          src="/tools/kobo-small.png"
          alt={t('tool.dashboard_card_img_alt')}
          height={64}
        />
        <Stack spacing={1}>
          <Typography>
            {t('tool.dashboard_card_kobo_title')}
          </Typography>
          <Link
            component={RouterLink}
            to="/tools"
          >
            {t('tool.dashboard_card_kobo_link')}
          </Link>
        </Stack>
      </Stack>
    </DashboardCard>
  )
}

export default ToolDashboardCard
