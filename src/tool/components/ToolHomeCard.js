import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { Link, Stack, Typography } from '@mui/material'

import HomeCard from 'home/components/HomeCard'
import theme from 'theme'

const ToolHomeCard = () => {
  const { t } = useTranslation()
  return (
    <HomeCard
      sx={{
        flexDirection: 'column',
        padding: theme.spacing(2)
      }}
    >
      <Typography variant="h5">
        {t('tool.home_card_title')}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          marginTop: theme.spacing(2),
          marginBottom: theme.spacing(2)
        }}
      >
        {t('tool.home_card_description')}
      </Typography>
      <Stack direction="row" spacing={3}>
        <img
          src="/tools/kobo-small.png"
          alt={t('tool.home_card_img_alt')}
          height={64}
        />
        <Stack spacing={1}>
          <Typography>
            {t('tool.home_card_kobo_title')}
          </Typography>
          <Link
            component={RouterLink}
            to="/tools"
          >
            {t('tool.home_card_kobo_link')}
          </Link>
        </Stack>
      </Stack>
    </HomeCard>
  )
}

export default ToolHomeCard
