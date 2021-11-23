import React from 'react'
import {
  Box,
  Card,
  Typography,
  Button,
  Link
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import theme from 'theme'

const { palette } = theme

const Avatar = ({ user }) => (
  <Box
    component="span"
    sx={{
      bgcolor: palette.gray.mid,
      width: 80,
      height: 80,
      borderRadius: '50%',
      margin: theme.spacing(2)
    }}
  >
    <Typography
      variant="h3"
      color={palette.white}
      sx={{ textAlign: 'center', marginTop: '10px' }}
    >
      {user.first_name.charAt(0)}
    </Typography>
  </Box>
)

const UserCard = ({ user }) => {
  const { t } = useTranslation()

  return (
    <Card variant="outlined" sx={{ display: 'flex' }}>
      <Avatar user={user} />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: '1 0 auto', padding: theme.spacing(2) }}>
          <Typography variant="h5">
            {user.first_name} {user.last_name}
          </Typography>
          <Box sx={{ marginTop: theme.spacing(1) }}>
            <Link href={`mailto:${user.email}`} underline="none">
              {user.email}
            </Link>
          </Box>
        </Box>
        <Box sx={{ padding: theme.spacing(2) }}>
          <Button variant="outlined" >
            {t('user.edit_profile_button')}
          </Button>
        </Box>
      </Box>
    </Card>
  )
}

export default UserCard
