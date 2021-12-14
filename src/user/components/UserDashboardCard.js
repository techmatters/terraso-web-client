import React from 'react'
import {
  Box,
  Typography,
  Button,
  Link
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import theme from 'theme'
import DashboardCard from 'dashboard/components/DashboardCard'

const { palette } = theme

const Avatar = ({ user }) => (
  <Box
    component="span"
    sx={{
      bgcolor: palette.gray.mid,
      width: 80,
      height: 80,
      borderRadius: '50%',
      margin: theme.spacing(1)
    }}
  >
    <Typography
      variant="h3"
      color={palette.white}
      sx={{ textAlign: 'center', marginTop: '10px' }}
    >
      {user.firstName.charAt(0)}
    </Typography>
  </Box>
)

const UserDashboardCard = ({ user }) => {
  const { t } = useTranslation()

  return (
    <DashboardCard>
      <Avatar user={user} />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: '1 0 auto', padding: theme.spacing(1) }}>
          <Typography variant="h5">
            {user.firstName} {user.lastName}
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
    </DashboardCard>
  )
}

export default UserDashboardCard
