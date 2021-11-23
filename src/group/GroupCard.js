import React from 'react'
import {
  Box,
  Card,
  CardActions,
  Typography,
  Button
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import theme from 'theme'

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

const GroupCard = ({ group }) => {
  const { t } = useTranslation()

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing(2)
      }}
    >
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
    </Card>
  )
}

export default GroupCard
