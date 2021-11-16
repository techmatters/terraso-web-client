import React from 'react'
import {
  Box,
  Card,
  Typography,
  Button
} from '@mui/material'
import { FormattedMessage } from 'react-intl'

import theme from '../../theme'

const { palette } = theme 


const Avatar = ({ user }) => (
  <Box
    component="span"
    sx={{
      bgcolor: palette.grey[300],
      width: 80,
      height: 80,
      borderRadius: '50%',
      margin: theme.spacing(2)
    }}
  >
    <Typography
      variant="h3"
      color={palette.background.paper}
      sx={{ textAlign: 'center', marginTop: '10px' }}
    >
      {user.first_name.charAt(0)}
    </Typography>
  </Box>
)

const UserCard = ({ user }) => (
  <Card variant="outlined" sx={{ display: 'flex' }}>
    <Avatar user={user} />
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: '1 0 auto', padding: theme.spacing(2) }}>
        <Typography variant="h5" component="div">
          {user.first_name} {user.last_name}
        </Typography>
        <Box sx={{ marginTop: theme.spacing(1) }}>
          <a href={`mailto:${user.email}`}>{user.email}</a>  
        </Box>
      </Box>
      <Box sx={{ padding: theme.spacing(2) }}>
        <Button variant="outlined" sx={{ color: 'grey.700', borderColor: 'grey.700' }} >
          <FormattedMessage id="user.edit_profile_button" />
        </Button>
      </Box>
    </Box>
  </Card>
)

export default UserCard