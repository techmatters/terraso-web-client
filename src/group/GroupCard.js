import React from 'react'
import {
  Box,
  Card,
  CardActions,
  Typography,
  Button
} from '@mui/material'
import { FormattedMessage } from 'react-intl'

import theme from '../theme'


const Avatar = () => (
  <Box
    component="span"
    sx={{
      bgcolor: 'grey.300',
      width: 80,
      height: 80
    }}
  >
  </Box>
)

const Actions = ({ group }) => {
  if (group.role !== 'manager') {
    return null
  }

  return (
    <CardActions sx={{ padding: 0 }}>
        <Button variant="outlined" component="div" sx={{ width:'100%', color: 'grey.700', borderColor: 'grey.700' }} >
          <FormattedMessage id="group.edit_profile_button" />
        </Button>
      </CardActions>
  )
}

const GroupCard = ({ group }) => (
  <Card
    variant="outlined"
    sx={{
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing(2)
    }}
  >
    <Box sx={{ display: 'flex', marginBottom: theme.spacing(2) }}>
      <Avatar />
      <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: theme.spacing(2) }}>
        <Typography variant="h5" component="div">
          {group.name}
        </Typography>
        <Typography variant="subtitle1" component="div">
          <FormattedMessage id={`group.role.${group.role}`} />
        </Typography>
      </Box>
    </Box>
    <Actions group={group} />
  </Card>
)

export default GroupCard