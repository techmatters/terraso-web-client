import React from 'react'
import {
  Box,
  Card,
  CardActions,
  Typography,
  Button,
  Alert
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import theme from 'theme'

const Actions = () => {
  const { t } = useTranslation()

  return (
    <CardActions sx={{ padding: 0 }}>
      <Button
        variant="outlined"
        component="div"
        sx={{ width: '100%', color: 'grey.700', borderColor: 'grey.700' }}
      >
        {t('group.default_connect_button')}
      </Button>
    </CardActions>
  )
}

const GroupDefaultCard = () => {
  const { t } = useTranslation()

  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing(2)
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" component="div">
          {t('group.default_title')}
        </Typography>
        <Alert
          severity="info"
          sx={{
            marginTop: theme.spacing(1),
            marginBottom: theme.spacing(1)
          }}
        >
          <Typography variant="body1" component="div">
            {t('group.default_content')}
          </Typography>
        </Alert>
      </Box>
      <Actions />
    </Card>
  )
}

export default GroupDefaultCard
